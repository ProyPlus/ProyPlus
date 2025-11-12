package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.*;
import com.example.gestor_inversores.service.project.IProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

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
    public ResponseEntity<List<ResponseProjectStudentDTO>> getStudentsByProject(@PathVariable Long id) {
        List<ResponseProjectStudentDTO> listResponseStudentDTO =
                projectService.getStudentsByProject(id);
        return ResponseEntity.status(HttpStatus.OK).body(listResponseStudentDTO);
    }

    @GetMapping
    public List<ResponseProjectDTO> getAllProjects(@RequestParam(defaultValue = "true") boolean active) {
        return projectService.getAllProjects(active);
    }

    @GetMapping("/dashboard-admin/projects")
    public ResponseEntity<List<ResponseProjectDTO>> getAllProjectsAdmin() {
        List<ResponseProjectDTO> projects = projectService.getAllProjectsAdmin();
        return ResponseEntity.status(HttpStatus.OK).body(projects);
    }

    /**
    // Endpoint usando ownerId
    @GetMapping("/by-owner/{ownerId}")
    public List<ResponseProjectDTO> getProjectsByOwnerId(@PathVariable Long ownerId) {
        return projectService.getProjectsByOwnerId(ownerId);
    }
    **/

    // Endpoint usando ownerId y parámetro active
    @GetMapping("/by-owner/{ownerId}")
    public List<ResponseProjectDTO> getProjectsByOwnerId(
            @PathVariable Long ownerId,
            @RequestParam(defaultValue = "true") boolean active) { // true = activos, false = inactivos
        return projectService.getProjectsByOwnerId(ownerId, active);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseProjectDTO> restoreProject(@PathVariable Long id) {
        ResponseProjectDTO restoredProject = projectService.activateProject(id);
        return ResponseEntity.status(HttpStatus.OK).body(restoredProject);
    }

    @PutMapping("/complete/{projectId}")
    public ResponseEntity<ResponseProjectDTO> completeProject(@PathVariable Long projectId, @RequestParam Long ownerId) {
        ResponseProjectDTO responseProjectDTO = projectService.completeProject(projectId, ownerId);
        return ResponseEntity.ok(responseProjectDTO);
    }

    @PutMapping("/cancel/{id}")
    public ResponseEntity<ResponseProjectDTO> cancelProject(@PathVariable Long id, @RequestParam Long ownerId) {
        ResponseProjectDTO responseProjectDTO = projectService.cancelProject(id, ownerId);
        return ResponseEntity.ok(responseProjectDTO);
    }
    @GetMapping("/tag/{tag}")
    public ResponseEntity<List<ResponseProjectDTO>> getProjectsByTag(@PathVariable String tag) {
        List<ResponseProjectDTO> projects = projectService.getProjectsByTag(tag);
        return ResponseEntity.status(HttpStatus.OK).body(projects);
    }

    @GetMapping("/by-investment/{investorId}")
        public ResponseEntity<List<ResponseProjectDTO>> getProjectsByInvestmentId(@PathVariable Long investorId) {
        List<ResponseProjectDTO> projects = projectService.getProjectsByInvestorId(investorId);
        return ResponseEntity.status(HttpStatus.OK).body(projects);
    }

    @PostMapping("/{projectId}/contact")
    public ResponseEntity<Void> contactProjectOwner(
            @PathVariable Long projectId,
            @RequestBody @Valid ContactOwnerDTO contactOwnerDTO) {
        projectService.contactProjectOwner(projectId, contactOwnerDTO);
        return ResponseEntity.status(HttpStatus.OK).build();
    }
}
