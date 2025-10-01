package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.RequestStudentUpdateDTO;
import com.example.gestor_inversores.dto.RequestStudentDTO;
import com.example.gestor_inversores.dto.ResponseStudentDTO;
import com.example.gestor_inversores.dto.ResponseStudentNameDTO;
import com.example.gestor_inversores.mapper.StudentMapper;
import com.example.gestor_inversores.model.Student;
import com.example.gestor_inversores.service.student.IStudentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private IStudentService studentService;

    // GET ALL
    @GetMapping
    public ResponseEntity<List<ResponseStudentDTO>> getAllStudents() {
        List<ResponseStudentDTO> studentsDTO = studentService.findAll().stream()
                .map(StudentMapper::studentToResponseStudentDTO)
                .toList();

        return ResponseEntity.ok(studentsDTO);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseStudentDTO> getStudentById(@PathVariable Long id) {
        return studentService.findById(id)
                .map(StudentMapper::studentToResponseStudentDTO)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    //Para poder mostrar la lista de alumnos cuando alguien crea un proyecto
    @GetMapping("/names")
    public ResponseEntity<List<ResponseStudentNameDTO>> getAllStudentNames() {
        List<ResponseStudentNameDTO> students = studentService.findAllStudentNames();
        return ResponseEntity.ok(students);
    }

    @PostMapping
    public ResponseEntity<ResponseStudentDTO> createStudent(@Valid @RequestBody RequestStudentDTO requestDTO) {
        Student saved = studentService.save(requestDTO);
        return ResponseEntity.ok(StudentMapper.studentToResponseStudentDTO(saved));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ResponseStudentDTO> patchStudent(
            @PathVariable Long id,
            @RequestBody RequestStudentUpdateDTO patchDto) {

        return studentService.patchStudent(id, patchDto)
                .map(StudentMapper::studentToResponseStudentDTO)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // DAR DE ALTA (enable)
    @PatchMapping("/activate/{id}")
    public ResponseEntity<ResponseStudentDTO> activateStudent(@PathVariable Long id) {
        Student student = studentService.activateStudent(id);
        return ResponseEntity.ok(StudentMapper.studentToResponseStudentDTO(student));
    }

    // DAR DE BAJA (disable)
    @PatchMapping("/desactivate/{id}")
    public ResponseEntity<ResponseStudentDTO> desactivateStudent(@PathVariable Long id) {
        Student student = studentService.desactivateStudent(id);
        return ResponseEntity.ok(StudentMapper.studentToResponseStudentDTO(student));
    }

}
