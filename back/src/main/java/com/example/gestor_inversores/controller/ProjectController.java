package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.RequestProjectDTO;
import com.example.gestor_inversores.dto.RequestProjectUpdateDTO;
import com.example.gestor_inversores.dto.ResponseProjectDTO;
import com.example.gestor_inversores.dto.ResponseStudentDTO;
import com.example.gestor_inversores.service.project.IProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
//@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final IProjectService projectService;

    @PostMapping
    public ResponseEntity<ResponseProjectDTO> create(@Valid @RequestBody RequestProjectDTO projectDTO) {
        ResponseProjectDTO responseProjectDTO = projectService.save(projectDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseProjectDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponseProjectDTO> update(@Valid @RequestBody RequestProjectUpdateDTO projectUpdateDTO, @PathVariable Long id) {
        ResponseProjectDTO responseProjectDTO = projectService.update(id, projectUpdateDTO);
        return ResponseEntity.status(HttpStatus.OK).body(responseProjectDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        projectService.delete(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseProjectDTO> getById(@PathVariable Long id) {
        ResponseProjectDTO responseProjectDTO = projectService.findById(id);
        return ResponseEntity.status(HttpStatus.OK).body(responseProjectDTO);
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<List<ResponseStudentDTO>> getStudentsByProject(@PathVariable Long id) {
        List<ResponseStudentDTO> listResponseStudentDTO = projectService.getStudentsByProject(id);
        return ResponseEntity.status(HttpStatus.OK).body(listResponseStudentDTO);
    }

    @GetMapping
    public ResponseEntity<List<ResponseProjectDTO>> getAll() {
        List<ResponseProjectDTO> list = projectService.getAllProjects();
        return ResponseEntity.status(HttpStatus.OK).body(list);
    }
}
