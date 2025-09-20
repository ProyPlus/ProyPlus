package com.example.gestor_inversores.service.student;

import com.example.gestor_inversores.dto.PatchStudentDTO;
import com.example.gestor_inversores.dto.CreateStudentDTO;
import com.example.gestor_inversores.mapper.StudentMapper;
import com.example.gestor_inversores.model.Role;
import com.example.gestor_inversores.model.Student;
import com.example.gestor_inversores.repository.IStudentRepository;
import com.example.gestor_inversores.service.role.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
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
    private RoleService roleService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private StudentMapper mapper;

    @Override
    public List<Student> findAll() {
        return studentRepository.findAll();
    }

    @Override
    public Optional<Student> findById(Long id) {
        return studentRepository.findById(id);
    }

    @Override
    public Student save(CreateStudentDTO dto) {
        // Convertir DTO a Entity usando el Mapper inyectado
        Student student = mapper.requestStudentDTOToStudent(dto);

        // Asignar valores de seguridad por defecto
        student.setEnabled(true);
        student.setAccountNotExpired(true);
        student.setAccountNotLocked(true);
        student.setCredentialNotExpired(true);

        // Asignar automáticamente el rol STUDENT (id=3)
        Role studentRole = roleService.findById(3L)
                .orElseThrow(() -> new RuntimeException("Rol STUDENT no encontrado"));
        student.setRolesList(Set.of(studentRole));

        // Encriptar contraseña
        if (student.getPassword() != null && !student.getPassword().isBlank()) {
            student.setPassword(passwordEncoder.encode(student.getPassword()));
        }

        return studentRepository.save(student);
    }

    @Override
    public void deleteById(Long id) {
        studentRepository.deleteById(id);
    }

    @Override
    public Optional<Student> patchStudent(Long id, PatchStudentDTO patchDto) {
        return studentRepository.findById(id).map(student -> {
            mapper.patchStudentFromDto(patchDto, student);
            return studentRepository.save(student);
        });
    }

    @Override
    public Student activateStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estudiante con id " + id + " no existe"));
        student.setEnabled(true);
        return studentRepository.save(student);
    }

    @Override
    public Student desactivateStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estudiante con id " + id + " no existe"));
        student.setEnabled(false);
        return studentRepository.save(student);
    }

}
