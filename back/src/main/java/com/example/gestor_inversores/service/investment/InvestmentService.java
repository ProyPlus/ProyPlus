package com.example.gestor_inversores.service.investment;

import com.example.gestor_inversores.dto.*;
import com.example.gestor_inversores.exception.*;
import com.example.gestor_inversores.mapper.InvestmentMapper;
import com.example.gestor_inversores.model.*;
import com.example.gestor_inversores.model.enums.Currency;
import com.example.gestor_inversores.model.enums.InvestmentStatus;
import com.example.gestor_inversores.model.enums.ContractStatus;
import com.example.gestor_inversores.model.enums.ProjectStatus;
import com.example.gestor_inversores.repository.*;
import com.example.gestor_inversores.service.contract.ContractService;
import com.example.gestor_inversores.service.currency.CurrencyConversionService;
import com.example.gestor_inversores.service.mail.IMailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class InvestmentService implements IInvestmentService {

    private final IInvestmentRepository investmentRepo;
    private final IProjectRepository projectRepo;
    private final IStudentRepository studentRepo;
    private final IInvestorRepository investorRepo;
    private final InvestmentMapper mapper;
    private final CurrencyConversionService currencyConversionService;
    private final IMailService mailService;
    private final ContractService contractService;

    @Autowired
    public InvestmentService(
            IInvestmentRepository investmentRepo,
            IProjectRepository projectRepo,
            IStudentRepository studentRepo,
            IInvestorRepository investorRepo,
            InvestmentMapper mapper,
            CurrencyConversionService currencyConversionService,
            IMailService mailService,
            @Lazy ContractService contractService
    ) {
        this.investmentRepo = investmentRepo;
        this.projectRepo = projectRepo;
        this.studentRepo = studentRepo;
        this.investorRepo = investorRepo;
        this.mapper = mapper;
        this.currencyConversionService = currencyConversionService;
        this.mailService = mailService;
        this.contractService = contractService;
    }

    @Override
    public ResponseInvestmentDTO cancelByInvestor(Long id) {
        Investment inv = investmentRepo.findByIdInvestmentAndDeletedFalse(id)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada"));

        if (inv.getStatus() != InvestmentStatus.IN_PROGRESS) {
            throw new UpdateException("La inversión no puede ser cancelada en el estado actual: " + inv.getStatus());
        }

        inv.setStatus(InvestmentStatus.CANCELLED);
        inv.setConfirmedAt(LocalDate.now());

        Investment updatedInvestment = investmentRepo.save(inv);

        autoCancelContractIfNeeded(updatedInvestment);

        return mapper.toResponse(updatedInvestment);
    }

    @Override
    public ResponseInvestmentDTO getById(Long id) {
        return investmentRepo.findByIdInvestmentAndDeletedFalse(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada"));
    }

    @Override
    public List<ResponseInvestmentDTO> getAll() {
        return investmentRepo.findByDeletedFalse()
                .stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseInvestmentDTO> getActiveForStudents() {
        List<InvestmentStatus> allowedStatuses = List.of(
                InvestmentStatus.IN_PROGRESS,
                InvestmentStatus.RECEIVED,
                InvestmentStatus.NOT_RECEIVED
        );
        return investmentRepo.findByDeletedFalseAndStatusIn(allowedStatuses)
                .stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseInvestmentDTO> getActiveByProjectForStudents(Long projectId) {
        List<InvestmentStatus> allowedStatuses = List.of(
                InvestmentStatus.IN_PROGRESS,
                InvestmentStatus.RECEIVED,
                InvestmentStatus.NOT_RECEIVED
        );
        return investmentRepo.findByProject_IdProjectAndDeletedFalseAndStatusIn(projectId, allowedStatuses)
                .stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ResponseInvestmentDTO delete(Long id) {
        Investment inv = investmentRepo.findById(id)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada con ID: " + id));

        if (inv.getStatus() == InvestmentStatus.RECEIVED) {
            Project project = inv.getProject();
            BigDecimal amountInUSD = inv.getAmount();
            if (inv.getCurrency() != Currency.USD) {
                amountInUSD = currencyConversionService
                        .getConversionRate(inv.getCurrency().name(), "USD")
                        .getRate()
                        .multiply(inv.getAmount());
            }
            BigDecimal newCurrentGoal = project.getCurrentGoal().subtract(amountInUSD);
            project.setCurrentGoal(newCurrentGoal.max(BigDecimal.ZERO));
            projectRepo.save(project);
        }

        inv.setStatus(InvestmentStatus.CANCELLED);
        inv.setDeleted(true);
        inv.setDeletedAt(LocalDate.now());

        autoCancelContractIfNeeded(inv);

        return mapper.toResponse(investmentRepo.save(inv));
    }

    @Override
    public ResponseInvestmentDTO confirmReceipt(Long investmentId, Long studentId) {
        Investment inv = investmentRepo.findByIdInvestmentAndDeletedFalse(investmentId)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada"));

        Student student = studentRepo.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException("Estudiante no encontrado"));

        Project project = projectRepo.findById(inv.getProject().getIdProject())
                .orElseThrow(() -> new ProjectNotFoundException("El proyecto asociado a la inversión no fue encontrado."));

        if (project.getStatus() != ProjectStatus.PENDING_FUNDING) {
            throw new BusinessException("No se pueden confirmar inversiones para un proyecto que no está en estado 'PENDING_FUNDING'. Estado actual: " + project.getStatus());
        }

        Long projectOwnerId = project.getOwner().getId();
        if (!projectOwnerId.equals(student.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para gestionar esta inversión. Solo el dueño del proyecto puede hacerlo.");
        }

        if (inv.getStatus() != InvestmentStatus.PENDING_CONFIRMATION) {
            throw new UpdateException("Esta inversión no puede ser confirmada en su estado actual. Se espera el estado 'PENDING_CONFIRMATION'. Estado actual: " + inv.getStatus());
        }

        BigDecimal amountInUSD = inv.getAmount();
        if (inv.getCurrency() != Currency.USD) {
            amountInUSD = currencyConversionService
                    .getConversionRate(inv.getCurrency().name(), "USD")
                    .getRate()
                    .multiply(inv.getAmount());
        }

        BigDecimal remainingBudget = project.getBudgetGoal().subtract(project.getCurrentGoal());

        if (amountInUSD.subtract(remainingBudget).compareTo(new BigDecimal("0.01")) > 0) {
            throw new BusinessException(String.format(
                    "No se puede confirmar la inversión. El monto (%.2f USD) excede el capital restante necesario para el proyecto (%.2f USD).",
                    amountInUSD, remainingBudget
            ));
        }

        inv.setStatus(InvestmentStatus.RECEIVED);
        inv.setConfirmedBy(student);
        inv.setConfirmedAt(LocalDate.now());

        BigDecimal newCurrentGoal = project.getCurrentGoal().add(amountInUSD);
        project.setCurrentGoal(newCurrentGoal);

        boolean justFunded = false;
        if (project.getStatus() == ProjectStatus.PENDING_FUNDING &&
            newCurrentGoal.compareTo(project.getBudgetGoal()) >= 0) {
            project.setStatus(ProjectStatus.IN_PROGRESS);
            justFunded = true;
        }

        projectRepo.save(project);

        Investment savedInvestment = investmentRepo.save(inv);

        String toInvestor = savedInvestment.getGeneratedBy().getEmail();
        String subject = String.format("¡Tu inversión para el proyecto '%s' ha sido confirmada!", savedInvestment.getProject().getName());
        String body = String.format(
            "Hola %s,\n\nTe confirmamos que el estudiante %s %s ha recibido tu inversión de %.2f %s para el proyecto '%s'.\n\n" +
            "¡Gracias por tu contribución!\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            savedInvestment.getGeneratedBy().getUsername(),
            student.getFirstName(),
            student.getLastName(),
            savedInvestment.getAmount(),
            savedInvestment.getCurrency(),
            savedInvestment.getProject().getName()
        );
        mailService.sendEmail(toInvestor, subject, body);

        if (justFunded) {
            Student owner = project.getOwner();
            String toOwner = owner.getEmail();
            String ownerSubject = String.format("¡Felicidades! Tu proyecto '%s' ha sido financiado", project.getName());
            String ownerBody = String.format(
                "Hola %s,\n\n¡Excelentes noticias! Tu proyecto '%s' ha alcanzado su meta de financiación de %.2f USD y su estado ahora es 'EN PROGRESO'.\n\n" +
                "Es hora de empezar a trabajar para hacerlo realidad.\n\n" +
                "¡Mucho éxito!,\nEl equipo de ProyPlus",
                owner.getFirstName(),
                project.getName(),
                project.getBudgetGoal()
            );
            mailService.sendEmail(toOwner, ownerSubject, ownerBody);
        }

        return mapper.toResponse(savedInvestment);
    }

    @Override
    public ResponseInvestmentDTO confirmPaymentSent(Long investmentId, RequestInvestmentActionByInvestorDTO dto) {
        Investment inv = investmentRepo.findByIdInvestmentAndDeletedFalse(investmentId)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada"));

        Investor investor = investorRepo.findById(dto.getInvestorId())
                .orElseThrow(() -> new InvestorNotFoundException("Inversor no encontrado"));

        if (!inv.getGeneratedBy().getId().equals(investor.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para confirmar el envío de esta inversión.");
        }

        if (inv.getStatus() != InvestmentStatus.IN_PROGRESS) {
            throw new UpdateException("Esta inversión no puede ser marcada como enviada en su estado actual. Se espera el estado 'IN_PROGRESS'. Estado actual: " + inv.getStatus());
        }

        inv.setStatus(InvestmentStatus.PENDING_CONFIRMATION);
        inv.setConfirmedAt(LocalDate.now()); // Usamos confirmedAt para registrar la fecha de esta acción

        Investment savedInvestment = investmentRepo.save(inv);

        // Notificar al estudiante (dueño del proyecto)
        Student student = savedInvestment.getProject().getOwner();
        String toStudent = student.getEmail();
        String subject = String.format("¡Inversión enviada para tu proyecto '%s'!", savedInvestment.getProject().getName());
        String body = String.format(
            "Hola %s,\n\nEl inversor '%s' ha confirmado que ha enviado su inversión de %.2f %s para tu proyecto '%s'.\n\n" +
            "Por favor, verifica la recepción de los fondos en tu cuenta y confirma la inversión en la plataforma.\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            student.getFirstName(),
            investor.getUsername(),
            savedInvestment.getAmount(),
            savedInvestment.getCurrency(),
            savedInvestment.getProject().getName()
        );
        mailService.sendEmail(toStudent, subject, body);

        return mapper.toResponse(savedInvestment);
    }

    @Override
    public ResponseInvestmentDTO markAsNotReceived(Long investmentId, Long studentId) {
        Investment inv = investmentRepo.findByIdInvestmentAndDeletedFalse(investmentId)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada"));

        Student student = studentRepo.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException("Estudiante no encontrado"));

        Long projectOwnerId = inv.getProject().getOwner().getId();
        if (!projectOwnerId.equals(student.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para gestionar esta inversión. Solo el dueño del proyecto puede hacerlo.");
        }

        if (inv.getStatus() != InvestmentStatus.PENDING_CONFIRMATION) {
            throw new UpdateException("Solo se puede marcar como no recibida una inversión que está pendiente de confirmación.");
        }

        inv.setStatus(InvestmentStatus.NOT_RECEIVED);
        inv.setConfirmedBy(student);
        inv.setConfirmedAt(LocalDate.now());

        Investment savedInvestment = investmentRepo.save(inv);

        autoCancelContractIfNeeded(savedInvestment);

        String toInvestor = savedInvestment.getGeneratedBy().getEmail();
        String subject = String.format("Alerta sobre tu inversión para el proyecto '%s'", savedInvestment.getProject().getName());
        String body = String.format(
            "Hola %s,\n\nEl estudiante %s %s ha reportado que NO ha recibido tu inversión de %.2f %s para el proyecto '%s'.\n\n" +
            "El contrato asociado ha sido cancelado automáticamente. Por favor, ponte en contacto con el estudiante para aclarar la situación o contacta a soporte si crees que es un error.\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            savedInvestment.getGeneratedBy().getUsername(),
            student.getFirstName(),
            student.getLastName(),
            savedInvestment.getAmount(),
            savedInvestment.getCurrency(),
            savedInvestment.getProject().getName()
        );
        mailService.sendEmail(toInvestor, subject, body);

        return mapper.toResponse(savedInvestment);
    }

    @Override
    public ResponseInvestmentDTO rejectOverfunded(Long investmentId, Long studentId) {
        Investment inv = investmentRepo.findByIdInvestmentAndDeletedFalse(investmentId)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada"));

        Student student = studentRepo.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException("Estudiante no encontrado"));

        Long projectOwnerId = inv.getProject().getOwner().getId();
        if (!projectOwnerId.equals(student.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para gestionar esta inversión. Solo el dueño del proyecto puede hacerlo.");
        }

        if (inv.getStatus() != InvestmentStatus.IN_PROGRESS) {
            throw new UpdateException("Esta inversión solo puede ser rechazada si está en estado 'IN_PROGRESS'. Estado actual: " + inv.getStatus());
        }

        inv.setStatus(InvestmentStatus.CANCELLED);
        inv.setConfirmedBy(student);
        inv.setConfirmedAt(LocalDate.now());

        Investment savedInvestment = investmentRepo.save(inv);

        autoCancelContractIfNeeded(savedInvestment);

        String toInvestor = savedInvestment.getGeneratedBy().getEmail();
        String subject = String.format("Acción requerida sobre tu inversión para el proyecto '%s'", savedInvestment.getProject().getName());
        String body = String.format(
                "Hola %s,\n\nTe informamos que tu inversión de %.2f %s para el proyecto '%s' no ha podido ser aceptada por el estudiante %s %s, debido a que el proyecto ya había alcanzado su meta de financiación.\n\n" +
                "El contrato asociado ha sido cancelado automáticamente. Por favor, ponte en contacto con el estudiante para coordinar la devolución de los fondos que puedas haber enviado.\n\n" +
                "Lamentamos los inconvenientes.\n\n" +
                "Saludos,\nEl equipo de ProyPlus",
                savedInvestment.getGeneratedBy().getUsername(),
                savedInvestment.getAmount(),
                savedInvestment.getCurrency(),
                savedInvestment.getProject().getName(),
                student.getFirstName(),
                student.getLastName()
        );
        mailService.sendEmail(toInvestor, subject, body);

        return mapper.toResponse(savedInvestment);
    }

    public ResponseInvestmentDTO returnInvestment(Long investmentId) {
        Investment inv = investmentRepo.findByIdInvestmentAndDeletedFalse(investmentId)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada"));

        // 🛡️ VALIDACIÓN DE SEGURIDAD
        ProjectStatus projectStatus = inv.getProject().getStatus();
        if (projectStatus != ProjectStatus.CANCELLED && projectStatus != ProjectStatus.NOT_FUNDED) {
            throw new BusinessException("Solo se puede iniciar la devolución de fondos para proyectos en estado CANCELLED o NOT_FUNDED.");
        }

        if (inv.getStatus() != InvestmentStatus.RECEIVED) {
            throw new UpdateException("Solo inversiones que ya han sido recibidas pueden iniciar el proceso de devolución.");
        }

        inv.setStatus(InvestmentStatus.PENDING_RETURN);
        inv.setConfirmedAt(LocalDate.now());

        return mapper.toResponse(investmentRepo.save(inv));
    }

    @Override
    public ResponseInvestmentDTO confirmRefund(Long investmentId, RequestInvestmentActionByInvestorDTO dto) {
        Investment inv = investmentRepo.findByIdInvestmentAndDeletedFalse(investmentId)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada"));
        Investor investor = investorRepo.findById(dto.getInvestorId())
                .orElseThrow(() -> new InvestorNotFoundException("Inversor no encontrado"));

        if (!inv.getGeneratedBy().getId().equals(investor.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para confirmar la devolución de esta inversión.");
        }

        if (inv.getStatus() != InvestmentStatus.PENDING_RETURN) {
            throw new UpdateException("Esta devolución no puede ser confirmada en su estado actual.");
        }

        inv.setStatus(InvestmentStatus.RETURNED);
        inv.setConfirmedAt(LocalDate.now());

        Project project = inv.getProject();
        BigDecimal amountInUSD = inv.getAmount();
        if (inv.getCurrency() != Currency.USD) {
            amountInUSD = currencyConversionService
                    .getConversionRate(inv.getCurrency().name(), "USD")
                    .getRate()
                    .multiply(inv.getAmount());
        }
        BigDecimal newCurrentGoal = project.getCurrentGoal().subtract(amountInUSD);

        project.setCurrentGoal(newCurrentGoal.max(BigDecimal.ZERO));
        projectRepo.save(project);

        Investment savedInvestment = investmentRepo.save(inv);

        Student student = project.getOwner();
        String toStudent = student.getEmail();
        String subject = String.format("Devolución confirmada para tu proyecto '%s'", project.getName());
        String body = String.format(
            "Hola %s,\n\nTe informamos que el inversor '%s' ha confirmado la recepción de la devolución de %.2f %s para tu proyecto '%s'.\n\n" +
            "El ciclo de inversión y devolución para este contrato ha sido completado exitosamente.\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            student.getFirstName(),
            investor.getUsername(),
            savedInvestment.getAmount(),
            savedInvestment.getCurrency(),
            project.getName()
        );
        mailService.sendEmail(toStudent, subject, body);

        return mapper.toResponse(savedInvestment);
    }

    @Override
    public List<ResponseInvestmentDTO> getByInvestor(Long investorId, InvestmentStatus status) {
        // 1. Validamos que el inversor exista
        if (!investorRepo.existsById(investorId)) {
            throw new InvestorNotFoundException("Inversor no encontrado con ID: " + investorId);
        }

        List<Investment> investments;

        // 2. Lógica condicional para filtrar
        if (status == null) {
            // Si no se especifica estado, traer todas las del inversor
            investments = investmentRepo.findByGeneratedBy_IdAndDeletedFalse(investorId);
        } else {
            // Si se especifica un estado, filtrar por inversor Y estado
            investments = investmentRepo.findByGeneratedBy_IdAndDeletedFalseAndStatus(investorId, status);
        }

        // 3. Mapear y devolver la lista de DTOs
        return investments.stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    private void autoCancelContractIfNeeded(Investment inv) {
        if (inv.getContract() != null &&
                (inv.getStatus() == InvestmentStatus.NOT_RECEIVED || inv.getStatus() == InvestmentStatus.CANCELLED)) {

            Contract contract = inv.getContract();

            if (contract.getStatus() == ContractStatus.SIGNED) {
                contract.setStatus(ContractStatus.CANCELLED);

                ContractAction action = ContractAction.builder()
                        .contract(contract)
                        .student(inv.getConfirmedBy()) 
                        .status(ContractStatus.CANCELLED)
                        .actionDate(LocalDate.now())
                        .build();

                contract.getActions().add(action);
                contractService.saveContract(contract);
            }
        }
    }
}
