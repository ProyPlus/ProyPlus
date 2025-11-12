package com.example.gestor_inversores.service.student;

import com.example.gestor_inversores.dto.*;
import com.example.gestor_inversores.exception.*;
import com.example.gestor_inversores.mapper.StudentMapper;
import com.example.gestor_inversores.model.Contract;
import com.example.gestor_inversores.model.Project;
import com.example.gestor_inversores.model.Role;
import com.example.gestor_inversores.model.Student;
import com.example.gestor_inversores.repository.IContractRepository;
import com.example.gestor_inversores.repository.IProjectRepository;
import com.example.gestor_inversores.repository.IStudentRepository;
import com.example.gestor_inversores.repository.IUserRepository;
import com.example.gestor_inversores.service.role.IRoleService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentService implements IStudentService {

    private final IStudentRepository studentRepository;
    private final IUserRepository userRepository;
    private final IProjectRepository projectRepository;
    private final IContractRepository contractRepository;
    private final IRoleService roleService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final StudentMapper mapper;

    @Override
    public ResponseStudentDTO findById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new StudentNotFoundException("Estudiante con id " + id + " no encontrado"));
        return mapper.studentToResponseStudentDTO(student);
    }

    @Override
    public Student save(RequestStudentDTO dto) {

        // Validar duplicados
        userRepository.findUserEntityByUsername(dto.getUsername())
                .ifPresent(u -> { throw new UsernameAlreadyExistsException("Username ya existe"); });

        userRepository.findByEmail(dto.getEmail())
                .ifPresent(u -> { throw new EmailAlreadyExistsException("Email ya existe"); });

        studentRepository.findByDni(dto.getDni())
                .ifPresent(s -> { throw new DniAlreadyExistsException("El dni ya existe."); });

        // Convertir DTO a entidad
        Student student = mapper.requestStudentDTOToStudent(dto);

        // Valores por defecto
        student.setEnabled(true);
        student.setAccountNotExpired(true);
        student.setAccountNotLocked(true);
        student.setCredentialNotExpired(true);

        // Asignar rol STUDENT por nombre
        Role studentRole = roleService.findByRole("STUDENT")
                .orElseThrow(() -> new RoleNotFoundException("Rol STUDENT no encontrado. Asegúrese de que esté creado en la base de datos."));
        student.setRolesList(Set.of(studentRole));

        // Encriptar contraseña
        if (student.getPassword() != null && !student.getPassword().isBlank()) {
            student.setPassword(passwordEncoder.encode(student.getPassword()));
        }

        try {
            return studentRepository.save(student);
        } catch (DataIntegrityViolationException | JpaSystemException ex) {
            throw new CreateException("No se pudo guardar el estudiante");
        }
    }

    @Override
    @Transactional
    public ResponseStudentDTO updateByAdmin(Long id, RequestStudentUpdateByAdminDTO dto) {
        Student studentToUpdate = studentRepository.findById(id)
                .orElseThrow(() -> new StudentNotFoundException("Estudiante con id " + id + " no encontrado para actualizar"));

        mapper.updateStudentFromAdminDto(dto, studentToUpdate);

        Student updatedStudent = studentRepository.save(studentToUpdate);
        return mapper.studentToResponseStudentDTO(updatedStudent);
    }

    @Transactional
    @Override
    public Optional<Student> patchStudent(Long id, RequestStudentUpdateDTO patchDto) {
        return studentRepository.findById(id).map(student -> {
            mapper.patchStudentFromDto(patchDto, student);

            try {
                return studentRepository.save(student);
            } catch (DataIntegrityViolationException | JpaSystemException ex) {
                throw new UpdateException("No se pudo actualizar el estudiante");
            }
        });
    }

    @Transactional
    @Override
    public void deleteById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new StudentNotFoundException("Estudiante con id " + id + " no existe"));
        try {
            studentRepository.deleteById(id);
        } catch (DataIntegrityViolationException | JpaSystemException ex) {
            throw new DeleteException("No se pudo eliminar el estudiante");
        }
    }

    @Transactional
    @Override
    public Student activateStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new StudentNotFoundException("Estudiante con id " + id + " no existe"));
        student.setEnabled(true);

        try {
            return studentRepository.save(student);
        } catch (DataIntegrityViolationException | JpaSystemException ex) {
            throw new UpdateException("No se pudo activar el estudiante");
        }
    }

    @Transactional
    @Override
    public Student desactivateStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new StudentNotFoundException("Estudiante con id " + id + " no existe"));

        String errorMessage = "El estudiante tiene proyectos o contratos activos y no puede ser eliminado.";

        // ✅ Validación: Comprobar si el estudiante tiene proyectos activos como propietario
        List<Project> ownedProjects = projectRepository.findByOwnerIdAndDeletedFalse(id);
        if (!ownedProjects.isEmpty()) {
            throw new StudentDesactivationException(errorMessage);
        }

        // ✅ Validación: Comprobar si el estudiante participa en proyectos activos
        List<Project> participatingProjects = projectRepository.findByStudents_IdAndDeletedFalse(id);
        if (!participatingProjects.isEmpty()) {
            throw new StudentDesactivationException(errorMessage);
        }

        // ✅ Validación: Comprobar si el estudiante (como dueño de proyecto) tiene contratos
        List<Contract> contracts = contractRepository.findByProjectOwnerId(id);
        if (!contracts.isEmpty()) {
            throw new StudentDesactivationException(errorMessage);
        }

        student.setEnabled(false);

        try {
            return studentRepository.save(student);
        } catch (DataIntegrityViolationException | JpaSystemException ex) {
            throw new UpdateException("No se pudo desactivar el estudiante");
        }
    }

    @Override
    public ResponseStudentDTO findByDni(String dni) {
        Student student = studentRepository.findByDni(dni)
                .orElseThrow(() -> new StudentNotFoundException("Estudiante con DNI " + dni + " no encontrado"));
        return mapper.studentToResponseStudentDTO(student);
    }

    @Override
    public List<ResponseStudentDTO> findAll() {
        return studentRepository.findAll().stream()
                .map(mapper::studentToResponseStudentDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseStudentNameDTO> findAllStudentNames() {
        return studentRepository.findAll().stream()
                .map(student -> new ResponseStudentNameDTO(
                        student.getId(),
                        student.getFirstName(),
                        student.getLastName()
                ))
                .toList();
    }

     public List<ResponseProjectByStudentDTO> getProjectsByStudentId(Long studentId, boolean active) {
        studentRepository.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException("Estudiante con id " + studentId + " no existe"));

        List<Project> projects = active
                ? projectRepository.findByStudents_IdAndDeletedFalse(studentId)
                : projectRepository.findByStudents_IdAndDeletedTrue(studentId);

        return StudentMapper.mapProjectsToResponseProjectDTO(new HashSet<>(projects), active);
    }

     @Override
    public Optional<ResponseStudentDTO> findByUsername(String username) {
        return studentRepository.findByUsername(username)
                .map(mapper::studentToResponseStudentDTO)
                .or(() -> {
                    throw new StudentNotFoundException(
                            "Estudiante con username '" + username + "' no existe");
                });
    } 

}
