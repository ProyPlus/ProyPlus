package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.RequestProjectDocumentDTO;
import com.example.gestor_inversores.dto.ResponseProjectDocumentDTO;
import com.example.gestor_inversores.model.ProjectDocument;
import com.example.gestor_inversores.service.projectDocument.ProjectDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import com.example.gestor_inversores.dto.ResponseProjectDocumentDTO;
import com.example.gestor_inversores.service.projectDocument.IProjectDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/project-documents")
@RequiredArgsConstructor
public class ProjectDocumentController {

    private final IProjectDocumentService projectDocumentService;

    @PostMapping("/upload")
    public ResponseEntity<ResponseProjectDocumentDTO> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("projectId") Long projectId) {

        ResponseProjectDocumentDTO response = projectDocumentService.saveFile(file, projectId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ResponseProjectDocumentDTO>> getAllByProject(@PathVariable Long projectId) {
        List<ResponseProjectDocumentDTO> list = projectDocumentService.getAllByProject(projectId);
        return ResponseEntity.status(HttpStatus.OK).body(list);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        projectDocumentService.delete(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        ResponseProjectDocumentDTO dto = projectDocumentService.findById(id);

        File file = new File(dto.getFilePath());
        if (!file.exists()) {
            throw new RuntimeException("File not found");
        }

        Resource resource = new org.springframework.core.io.FileSystemResource(file);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + dto.getFileName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }


}

