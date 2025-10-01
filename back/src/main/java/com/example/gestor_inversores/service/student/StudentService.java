package com.example.gestor_inversores.service.student;

import com.example.gestor_inversores.dto.RequestStudentUpdateDTO;
import com.example.gestor_inversores.dto.RequestStudentDTO;
import com.example.gestor_inversores.dto.ResponseStudentNameDTO;
import com.example.gestor_inversores.exception.*;
import com.example.gestor_inversores.mapper.StudentMapper;
import com.example.gestor_inversores.model.Role;
import com.example.gestor_inversores.model.Student;
import com.example.gestor_inversores.repository.IStudentRepository;
import com.example.gestor_inversores.repository.IUserRepository;
import com.example.gestor_inversores.service.role.RoleService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class StudentService implements IStudentService {

    @Autowired
    private IStudentRepository studentRepository;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private RoleService roleService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private StudentMapper mapper;

    @Override
    public Optional<Student> findById(Long id) {
        return studentRepository.findById(id);
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

        // Asignar rol STUDENT (id=3)
        Role studentRole = roleService.findById(3L)
                .orElseThrow(() -> new RuntimeException("Rol STUDENT no encontrado"));
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
        student.setEnabled(false);

        try {
            return studentRepository.save(student);
        } catch (DataIntegrityViolationException | JpaSystemException ex) {
            throw new UpdateException("No se pudo desactivar el estudiante");
        }
    }

    @Override
    public Optional<Student> findByDni(String dni) {
        return studentRepository.findByDni(dni);
    }

    @Override
    public List<Student> findAll() {
        return studentRepository.findAll();
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


}
