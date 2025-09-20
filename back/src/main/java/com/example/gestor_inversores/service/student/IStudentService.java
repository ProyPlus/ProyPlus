package com.example.gestor_inversores.service.student;

import com.example.gestor_inversores.dto.PatchStudentDTO;
import com.example.gestor_inversores.dto.CreateStudentDTO;
import com.example.gestor_inversores.model.Student;

import java.util.List;
import java.util.Optional;

public interface IStudentService {

    public List<Student> findAll();

    public Optional<Student> findById(Long id);

    public Student save(CreateStudentDTO student);

    public void deleteById(Long id);

    Optional<Student> patchStudent(Long id, PatchStudentDTO patchDto);

    Student activateStudent(Long id);

    Student desactivateStudent(Long id);
}
