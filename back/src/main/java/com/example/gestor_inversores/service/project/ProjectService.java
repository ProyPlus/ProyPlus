package com.example.gestor_inversores.service.project;

import com.example.gestor_inversores.dto.RequestProjectDTO;
import com.example.gestor_inversores.dto.RequestProjectUpdateDTO;
import com.example.gestor_inversores.dto.ResponseProjectDTO;
import com.example.gestor_inversores.dto.ResponseStudentDTO;
import com.example.gestor_inversores.exception.*;
import com.example.gestor_inversores.mapper.ProjectMapper;
import com.example.gestor_inversores.mapper.StudentMapper;
import com.example.gestor_inversores.model.Project;
import com.example.gestor_inversores.model.Student;
import com.example.gestor_inversores.repository.IProjectRepository;
import com.example.gestor_inversores.service.student.IStudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProjectService implements IProjectService {

    private final IProjectRepository projectRepository;
    private final IStudentService studentService;
    private final StudentMapper studentMapper;

    @Autowired
    public ProjectService(IProjectRepository projectRepository, IStudentService studentService, StudentMapper studentMapper) {
        this.projectRepository = projectRepository;
        this.studentService = studentService;
        this.studentMapper = studentMapper;
    }

    @Transactional
    @Override
    public ResponseProjectDTO save(RequestProjectDTO projectDTO) {

        // Validar nombre duplicado
        if (projectRepository.existsByNameAndDeletedFalse(projectDTO.getName())) {
            throw new ExistingProjectException("There is already a project with that name");
        }

        // Validar fechas
        if (projectDTO.getEstimatedEndDate().isBefore(projectDTO.getStartDate())) {
            throw new InvalidProjectException("Estimated end date cannot be before start date");
        }

        // Obtener estudiante dueño del proyecto
        Student owner = studentService.findById(projectDTO.getOwnerId())
                .orElseThrow(() -> new StudentNotFoundException("The student was not found"));

        // Mapear DTO a entidad
        Project project = ProjectMapper.requestProjectToProject(projectDTO);
        project.setCurrentGoal(BigDecimal.ZERO);
        project.setCreatedAt(LocalDateTime.now());

        // Agregar dueño y relación bidireccional
        project.getStudents().add(owner);
        owner.getProjectsList().add(project);

        // Agregar estudiantes adicionales (si los hay)
        if (projectDTO.getStudentIds() != null) {
            for (Long studentId : projectDTO.getStudentIds()) {
                // Evitar agregar al dueño dos veces
                if (studentId.equals(owner.getId())) continue;

                Student student = studentService.findById(studentId)
                        .orElseThrow(() -> new StudentNotFoundException(
                                "Student with ID " + studentId + " not found"));

                project.getStudents().add(student);
                student.getProjectsList().add(project);
            }
        }

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

        if(!projectDTO.getName().equals(searchedProject.getName()) &&
                projectRepository.existsByNameAndDeletedFalse(projectDTO.getName())) {
            throw new ExistingProjectException("There is already a project with that name");
        }

        if(projectDTO.getEstimatedEndDate().isBefore(projectDTO.getStartDate())) {
            throw new InvalidProjectException("Estimated end date cannot be before start date");
        }

        Project updatedProject = ProjectMapper.requestProjectUpdateToProject(projectDTO, searchedProject);
        updatedProject.setModifiedAt(LocalDateTime.now());

        Set<Long> studentIds = projectDTO.getStudentIds();

        if (Objects.nonNull(studentIds)) {

            Set<Student> studentsFromDTO = studentIds.stream()
                    .map(studentId -> studentService.findById(studentId)
                            .orElseThrow(() -> new StudentNotFoundException(
                                    "Student with ID " + studentId + " not found"))
                    )
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

        searchedProject.setDeleted(true);
        searchedProject.setDeletedAt(LocalDateTime.now());
        projectRepository.save(searchedProject);
    }

    @Override
    public List<ResponseProjectDTO> getAllProjects() {
        return projectRepository.findByDeletedFalse()
                .stream()
                .map(ProjectMapper::projectToResponseProjectDTO)
                .toList();
    }

    @Override
    public List<ResponseStudentDTO> getStudentsByProject(Long projectId) {
        Project project = projectRepository.findByIdProjectAndDeletedFalse(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("The project was not found"));

        return project.getStudents()
                .stream()
                .map(StudentMapper::studentToResponseStudentDTO)
                .toList();
    }

    @Override
    public ResponseProjectDTO findById(Long id) {
        Project project = projectRepository.findByIdProjectAndDeletedFalse(id)
                .orElseThrow(() -> new ProjectNotFoundException("The project was not found"));

        return ProjectMapper.projectToResponseProjectDTO(project);
    }

}
