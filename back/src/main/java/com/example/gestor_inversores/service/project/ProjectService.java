package com.example.gestor_inversores.service.project;

import com.example.gestor_inversores.dto.ContactOwnerDTO;
import com.example.gestor_inversores.dto.RequestProjectDTO;
import com.example.gestor_inversores.dto.RequestProjectUpdateDTO;
import com.example.gestor_inversores.dto.ResponseProjectDTO;
import com.example.gestor_inversores.dto.ResponseProjectStudentDTO;
import com.example.gestor_inversores.exception.*;
import com.example.gestor_inversores.mapper.ProjectMapper;
import com.example.gestor_inversores.mapper.ProjectStudentMapper;
import com.example.gestor_inversores.model.*;
import com.example.gestor_inversores.model.enums.ContractStatus;
import com.example.gestor_inversores.model.enums.ProjectStatus;
import com.example.gestor_inversores.repository.IContractRepository;
import com.example.gestor_inversores.repository.IInvestmentRepository;
import com.example.gestor_inversores.repository.IProjectRepository;
import com.example.gestor_inversores.repository.IStudentRepository;
import com.example.gestor_inversores.service.contract.IContractService;
import com.example.gestor_inversores.service.ia.GeminiService;
import com.example.gestor_inversores.service.mail.IMailService;
import com.example.gestor_inversores.service.student.IStudentService;
import com.example.gestor_inversores.service.projectTag.IProjectTagService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService implements IProjectService {

    private final IProjectRepository projectRepository;
    private final IStudentService studentService;
    private final IProjectTagService projectTagService;
    private final GeminiService geminiService;
    private final IStudentRepository studentRepository;
    private final IContractRepository contractRepository;
    private final IInvestmentRepository investmentRepository;
    private final IMailService mailService;
    private final IContractService contractService;

    @Transactional
    @Override
    public ResponseProjectDTO save(RequestProjectDTO projectDTO) {

        if (projectRepository.existsByNameAndDeletedFalse(projectDTO.getName())) {
            throw new ExistingProjectException("There is already a project with that name");
        }

        if (projectDTO.getEstimatedEndDate().isBefore(projectDTO.getStartDate())) {
            throw new InvalidProjectException("Estimated end date cannot be before start date");
        }

        Student owner = studentRepository.findById(projectDTO.getOwnerId())
                .orElseThrow(() -> new StudentNotFoundException("The student was not found"));

        Project project = ProjectMapper.requestProjectToProject(projectDTO, owner);
        project.setCurrentGoal(BigDecimal.ZERO);
        project.setCreatedAt(LocalDateTime.now());
        project.setStatus(ProjectStatus.PENDING_FUNDING);

        project.getStudents().add(owner);
        owner.getProjectsList().add(project);

        if (projectDTO.getStudentIds() != null) {
            for (Long studentId : projectDTO.getStudentIds()) {
                if (studentId.equals(owner.getId())) continue;

                Student student = studentRepository.findById(studentId)
                        .orElseThrow(() -> new StudentNotFoundException(
                                "Student with ID " + studentId + " not found"));

                project.getStudents().add(student);
                student.getProjectsList().add(project);
            }
        }

        String selectedTag = geminiService.askGemini(this.promptToGenerateTagSelection(project.getDescription())).toUpperCase();
        String cleanedTag = selectedTag.trim();
        System.out.println("Esta es la etiqueta limpia: " + cleanedTag);
        ProjectTag tag = projectTagService.getTagByName(cleanedTag);
        project.setProjectTag(tag);

        Project savedProject;
        try {
            savedProject = projectRepository.save(project);
        } catch (DataIntegrityViolationException | JpaSystemException ex) {
            throw new CreateException("The project could not be saved");
        }

        return ProjectMapper.projectToResponseProjectDTO(savedProject);
    }

    @Transactional
    @Override
    public ResponseProjectDTO update(Long id, RequestProjectUpdateDTO projectDTO) {
        Project searchedProject = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("The project was not found"));

        // VALIDACIÓN: Solo permitir la modificación si el proyecto está pendiente de financiación.
        if (searchedProject.getStatus() != ProjectStatus.PENDING_FUNDING) {
            throw new BusinessException("El proyecto solo puede ser modificado si su estado es 'Pendiente de Financiación' (PENDING_FUNDING).");
        }

        // VALIDACIÓN: No permitir la modificación si el proyecto ya ha recibido fondos.
        if (searchedProject.getCurrentGoal().compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessException("El proyecto no puede ser modificado porque ya ha comenzado a recibir inversiones.");
        }

        if (!projectDTO.getName().equals(searchedProject.getName()) &&
                projectRepository.existsByNameAndDeletedFalse(projectDTO.getName())) {
            throw new ExistingProjectException("There is already a project with that name");
        }

        if (projectDTO.getEstimatedEndDate().isBefore(projectDTO.getStartDate())) {
            throw new InvalidProjectException("Estimated end date cannot be before start date");
        }

        // Si la descripción cambia, se vuelve a evaluar la etiqueta con la IA
        if (!projectDTO.getDescription().equals(searchedProject.getDescription())) {
            String selectedTag = geminiService.askGemini(this.promptToGenerateTagSelection(projectDTO.getDescription())).toUpperCase();
            String cleanedTag = selectedTag.trim();
            System.out.println("Etiqueta re-evaluada por cambio en descripción: " + cleanedTag);
            ProjectTag tag = projectTagService.getTagByName(cleanedTag);
            searchedProject.setProjectTag(tag);
        }

        Project updatedProject = ProjectMapper.requestProjectUpdateToProject(projectDTO, searchedProject);
        updatedProject.setModifiedAt(LocalDateTime.now());

        Set<Long> studentIds = projectDTO.getStudentIds();
        if (Objects.nonNull(studentIds)) {
            Set<Student> studentsFromDTO = studentIds.stream()
                    .map(studentId -> studentRepository.findById(studentId)
                            .orElseThrow(() -> new StudentNotFoundException(
                                    "Student with ID " + studentId + " not found")))
                    .collect(Collectors.toSet());

            Set<Student> currentStudents = updatedProject.getStudents();
            Set<Student> studentsToRemove = currentStudents.stream()
                    .filter(current -> !studentsFromDTO.contains(current))
                    .collect(Collectors.toSet());

            Set<Student> studentsToAdd = studentsFromDTO.stream()
                    .filter(newStudent -> !currentStudents.contains(newStudent))
                    .collect(Collectors.toSet());

            studentsToRemove.forEach(student -> {
                student.getProjectsList().remove(updatedProject);
                updatedProject.getStudents().remove(student);
            });

            studentsToAdd.forEach(student -> {
                student.getProjectsList().add(updatedProject);
                updatedProject.getStudents().add(student);
            });
        }

        try {
            projectRepository.save(updatedProject);
        } catch (DataIntegrityViolationException | JpaSystemException ex) {
            throw new UpdateException("The project could not be updated");
        }

        return ProjectMapper.projectToResponseProjectDTO(updatedProject);
    }

    @Override
    public void delete(Long id) {
        Project searchedProject = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("The project was not found"));

        // VALIDACIÓN: No permitir la eliminación si el proyecto ya tiene contratos asociados.
        List<Contract> contracts = contractRepository.findByProject_IdProject(id);
        if (!contracts.isEmpty()) {
            throw new BusinessException("El proyecto no puede ser eliminado porque ya tiene contratos asociados.");
        }

        // VALIDACIÓN: No permitir la eliminación si el proyecto ya ha recibido fondos.
        if (searchedProject.getCurrentGoal().compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessException("El proyecto no puede ser eliminado porque ya ha recibido inversiones.");
        }

        searchedProject.setDeleted(true);
        searchedProject.setDeletedAt(LocalDateTime.now());
        projectRepository.save(searchedProject);
    }

    @Override
    public List<ResponseProjectDTO> getAllProjects(boolean active) {
        List<Project> projects;
        if (active) {
            projects = projectRepository.findByDeletedFalse();
        } else {
            projects = projectRepository.findByDeletedTrue();
        }
        return projects.stream()
                .map(ProjectMapper::projectToResponseProjectDTO)
                .toList();
    }

    @Override
    public List<ResponseProjectDTO> getAllProjectsAdmin() {
        List<Project> projects = projectRepository.findAll();

        return projects.stream()
                .map(ProjectMapper::projectToResponseProjectDTO)
                .toList();
    }

    @Override
    public List<ResponseProjectStudentDTO> getStudentsByProject(Long projectId) {
        Project project = projectRepository.findByIdProjectAndDeletedFalse(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("The project was not found"));

        return project.getStudents().stream()
                .filter(s -> !s.getId().equals(project.getOwner().getId()))
                .map(ProjectStudentMapper::studentToResponseProjectStudentDTO)
                .toList();
    }

    @Override
    public ResponseProjectDTO findById(Long id) {
        Project project = projectRepository.findByIdProjectAndDeletedFalse(id)
                .orElseThrow(() -> new ProjectNotFoundException("The project was not found"));
        return ProjectMapper.projectToResponseProjectDTO(project);
    }

    @Override
    public List<ResponseProjectDTO> getProjectsByOwner(Student owner) {
        List<Project> projects = projectRepository.findByOwner(owner);
        return projects.stream()
                .map(ProjectMapper::projectToResponseProjectDTO)
                .toList();
    }

    @Override
    public List<ResponseProjectDTO> getProjectsByOwnerId(Long ownerId, boolean active) {
        boolean ownerExists = projectRepository.existsByOwnerId(ownerId);
        if (!ownerExists) {
            throw new OwnerNotFoundException("El owner con id " + ownerId + " no existe");
        }

        List<Project> projects;
        if (active) {
            projects = projectRepository.findByOwnerIdAndDeletedFalse(ownerId);
        } else {
            projects = projectRepository.findByOwnerIdAndDeletedTrue(ownerId);
        }
        return projects.stream()
                .map(ProjectMapper::projectToResponseProjectDTO)
                .toList();
    }

    @Override
    public ResponseProjectDTO activateProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("El proyecto no existe"));

        if (!project.getDeleted()) {
            throw new BusinessException("El proyecto ya está activo");
        }

        project.setDeleted(false);
        project.setDeletedAt(null);
        project.setModifiedAt(LocalDateTime.now());

        Project restored = projectRepository.save(project);
        return ProjectMapper.projectToResponseProjectDTO(restored);
    }

    @Transactional
    @Override
    public ResponseProjectDTO completeProject(Long projectId, Long ownerId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("El proyecto no fue encontrado"));

        if (!project.getOwner().getId().equals(ownerId)) {
            throw new UnauthorizedOperationException("Solo el dueño del proyecto puede marcarlo como completado.");
        }

        if (project.getStatus() != ProjectStatus.IN_PROGRESS) {
            throw new BusinessException("El proyecto solo puede completarse si está en estado 'IN_PROGRESS'.");
        }

        List<Contract> contracts = contractRepository.findByProject_IdProject(projectId);
        boolean allContractsFinalized = contracts.stream().allMatch(contract ->
                contract.getStatus() == ContractStatus.CLOSED ||
                contract.getStatus() == ContractStatus.CANCELLED ||
                contract.getStatus() == ContractStatus.REFUNDED
        );

        if (!allContractsFinalized) {
            throw new BusinessException("No se puede completar el proyecto. Aún hay contratos activos o pendientes.");
        }

        project.setStatus(ProjectStatus.COMPLETED);
        project.setEndDate(LocalDate.now());
        project.setModifiedAt(LocalDateTime.now());

        Project savedProject = projectRepository.save(project);

        Student owner = savedProject.getOwner();
        String toOwner = owner.getEmail();
        String ownerSubject = String.format("¡Tu proyecto '%s' ha sido completado!", savedProject.getName());
        String ownerBody = String.format(
            "Hola %s,\n\n¡Felicidades! Has marcado tu proyecto '%s' como completado.\n\n" +
            "Gracias por tu esfuerzo y dedicación. El ciclo de este proyecto en nuestra plataforma ha finalizado exitosamente.\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            owner.getFirstName(),
            savedProject.getName()
        );
        mailService.sendEmail(toOwner, ownerSubject, ownerBody);

        return ProjectMapper.projectToResponseProjectDTO(savedProject);
    }

    @Transactional
    @Override
    public ResponseProjectDTO cancelProject(Long projectId, Long ownerId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("El proyecto no fue encontrado"));

        if (!project.getOwner().getId().equals(ownerId)) {
            throw new UnauthorizedOperationException("Solo el dueño del proyecto puede cancelarlo.");
        }

        if (project.getStatus() != ProjectStatus.IN_PROGRESS) {
            throw new BusinessException("El proyecto solo puede cancelarse si está en estado 'IN_PROGRESS'.");
        }

        project.setStatus(ProjectStatus.CANCELLED);
        project.setEndDate(LocalDate.now());
        project.setModifiedAt(LocalDateTime.now());

        List<Investment> allInvestments = investmentRepository.findByProject_IdProject(projectId);
        Set<Investor> investorsToNotify = allInvestments.stream()
                .map(Investment::getGeneratedBy)
                .collect(Collectors.toSet());

        for (Investor investor : investorsToNotify) {
            String investmentDetails = buildInvestmentDetailsString(allInvestments, investor);

            String to = investor.getEmail();
            String subject = String.format("Cancelación del Proyecto: '%s'", project.getName());
            String body = String.format(
                "Hola %s,\n\nTe informamos que el proyecto '%s' ha sido cancelado por el estudiante responsable.\n\n" +
                "El siguiente paso es la devolución de %s.\n\n" + // Usamos el string construido
                "Por favor, mantente atento a las notificaciones en la plataforma y contacta al estudiante si tienes alguna duda.\n\n" +
                "Lamentamos los inconvenientes.\n\n" +
                "Saludos,\nEl equipo de ProyPlus",
                investor.getUsername(),
                project.getName(),
                investmentDetails
            );
            mailService.sendEmail(to, subject, body);
        }

        Project savedProject = projectRepository.save(project);
        return ProjectMapper.projectToResponseProjectDTO(savedProject);
    }

    @Transactional
    @Override
    public ResponseProjectDTO failFundingProject(Long projectId, Long ownerId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("El proyecto no fue encontrado"));

        if (!project.getOwner().getId().equals(ownerId)) {
            throw new UnauthorizedOperationException("Solo el dueño del proyecto puede realizar esta acción.");
        }

        if (project.getStatus() != ProjectStatus.PENDING_FUNDING) {
            throw new BusinessException("El proyecto solo puede marcarse como no financiado si está en estado 'PENDING_FUNDING'.");
        }

        project.setStatus(ProjectStatus.NOT_FUNDED);
        project.setEndDate(LocalDate.now());
        project.setModifiedAt(LocalDateTime.now());

        List<Investment> allInvestments = investmentRepository.findByProject_IdProject(projectId);
        Set<Investor> investorsToNotify = allInvestments.stream()
                .map(Investment::getGeneratedBy)
                .collect(Collectors.toSet());

        for (Investor investor : investorsToNotify) {
            String investmentDetails = buildInvestmentDetailsString(allInvestments, investor);

            String to = investor.getEmail();
            String subject = String.format("Proyecto no financiado: '%s'", project.getName());
            String body = String.format(
                    "Hola %s,\n\nTe informamos que el proyecto '%s' no alcanzó su meta de financiación y ha sido marcado como no financiado.\n\n" +
                    "El siguiente paso es la devolución de %s.\n\n" + // Usamos el string construido
                    "Por favor, mantente atento a las notificaciones en la plataforma y contacta al estudiante para coordinar la devolución.\n\n" +
                    "Lamentamos los inconvenientes.\n\n" +
                    "Saludos,\nEl equipo de ProyPlus",
                    investor.getUsername(),
                    project.getName(),
                    investmentDetails
            );
            mailService.sendEmail(to, subject, body);
        }

        Project savedProject = projectRepository.save(project);

        Student owner = savedProject.getOwner();
        String toOwner = owner.getEmail();
        String ownerSubject = String.format("Tu proyecto '%s' no ha alcanzado la financiación", savedProject.getName());
        String ownerBody = String.format(
                "Hola %s,\n\nEl período de financiación para tu proyecto '%s' ha finalizado sin alcanzar el objetivo.\n\n" +
                "Ahora debes iniciar el proceso de devolución de las inversiones a cada participante.\n\n" +
                "Puedes gestionar la devolución desde la sección de contratos de tu proyecto.\n\n" +
                "Saludos,\nEl equipo de ProyPlus",
                owner.getFirstName(),
                savedProject.getName()
        );
        mailService.sendEmail(toOwner, ownerSubject, ownerBody);

        return ProjectMapper.projectToResponseProjectDTO(savedProject);
    }

    @Override
    public void contactProjectOwner(Long projectId, ContactOwnerDTO contactOwnerDTO) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("El proyecto no fue encontrado"));

        Student owner = project.getOwner();
        String ownerEmail = owner.getEmail();

        String subject = String.format("Mensaje sobre tu proyecto '%s': %s", project.getName(), contactOwnerDTO.getSubject());
        String body = String.format(
            "Hola %s,\n\nHas recibido un mensaje de '%s' sobre tu proyecto '%s'.\n\n" +
            "--------------------------------------------------\n" +
            "Mensaje:\n%s\n" +
            "--------------------------------------------------\n\n" +
            "Para continuar la conversación, puedes responder directamente a este correo.\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            owner.getFirstName(),
            contactOwnerDTO.getFromName(),
            project.getName(),
            contactOwnerDTO.getMessage()
        );

        // Usamos el nuevo método para establecer la dirección de respuesta
        mailService.sendEmail(ownerEmail, subject, body, contactOwnerDTO.getFromEmail());
    }

    @Override
    public List<ResponseProjectDTO> getProjectsByTag(String tag) {
        ProjectTag projectTag = projectTagService.getTagByName(tag);

        List<Project> projects = projectRepository.findByProjectTagAndDeletedFalse(projectTag);

        return projects.stream()
                .map(ProjectMapper::projectToResponseProjectDTO)
                .toList();
    }

    @Override
    public List<ResponseProjectDTO> getProjectsByInvestorId(Long investorId) {
        Set<Project> projects = investmentRepository.findDistinctProjectsByInvestorId(investorId)
                .orElseThrow(() -> new ProjectNotFoundException("No se encontraron proyectos para el inversor con ID: " + investorId));

        return projects.stream()
                .map(ProjectMapper::projectToResponseProjectDTO)
                .toList();
    }

    private String buildInvestmentDetailsString(List<Investment> allInvestments, Investor investor) {
        List<Investment> investorSpecificInvestments = allInvestments.stream()
                .filter(inv -> inv.getGeneratedBy().equals(investor))
                .toList();

        int investmentCount = investorSpecificInvestments.size();

        Map<String, BigDecimal> sumsByCurrency = investorSpecificInvestments.stream()
                .collect(Collectors.groupingBy(
                        inv -> inv.getCurrency().name(),
                        Collectors.reducing(BigDecimal.ZERO, Investment::getAmount, BigDecimal::add)
                ));

        String totalInvestedString = sumsByCurrency.entrySet().stream()
                .map(entry -> String.format("%.2f %s", entry.getValue(), entry.getKey()))
                .collect(Collectors.joining(" y "));

        String investmentDetails;
        if (investmentCount == 1) {
            investmentDetails = String.format("tu inversión de %s", totalInvestedString);
        } else {
            investmentDetails = String.format("tus %d inversiones, que suman un total de %s", investmentCount, totalInvestedString);
        }

        return investmentDetails;
    }

    private String promptToGenerateTagSelection(String description) {
        return """
                ERES UN CLASIFICADOR DE PROYECTOS EXPERTO.
                Tu **ÚNICA** tarea es analizar la 'Descripción del proyecto' y **responder ÚNICA Y EXCLUSIVAMENTE** con una sola palabra, que debe ser una de las etiquetas enumeradas.
                
                REGLAS EXTREMADAMENTE OBLIGATORIAS:
                1. **DEBES** elegir una de las etiquetas exactas.
                2. **NO PUEDES** responder con ninguna explicación, saludo, frase, punto, coma, o carácter adicional.
                3. Si la descripción no encaja perfectamente, elige la etiqueta **MÁS** cercana.
                4. Tu respuesta debe ser **SOLO LA ETIQUETA EN MAYÚSCULAS**.
                
                TECNOLOGÍA

                EDUCACIÓN

                SALUD Y BIENESTAR

                SOSTENIBILIDAD Y MEDIO AMBIENTE

                ARTE Y CULTURA

                FINANCIERO

                COMERCIO ELECTRÓNICO

                ALIMENTOS Y BEBIDAS

                SERVICIOS PROFESIONALES

                IMPACTO SOCIAL

                OTROS
                
                Descripción del proyecto:
                """ + description + """

Respuesta de la etiqueta única:""";
    }
}
