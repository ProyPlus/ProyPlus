package com.example.gestor_inversores.service.student;

import com.example.gestor_inversores.dto.RequestStudentUpdateDTO;
import com.example.gestor_inversores.dto.RequestStudentDTO;
import com.example.gestor_inversores.dto.ResponseStudentNameDTO;
import com.example.gestor_inversores.model.Student;

import java.util.List;
import java.util.Optional;

public interface IStudentService {

    public List<Student> findAll();

    public Optional<Student> findById(Long id);

    public Optional<Student> findByDni(String dni);

    public Student save(RequestStudentDTO student);

    public void deleteById(Long id);

    Optional<Student> patchStudent(Long id, RequestStudentUpdateDTO patchDto);

    Student activateStudent(Long id);

    Student desactivateStudent(Long id);

    List<ResponseStudentNameDTO> findAllStudentNames();

}
