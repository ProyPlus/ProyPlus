package com.example.gestor_inversores.service.projectDocument;

import com.example.gestor_inversores.dto.ResponseProjectDocumentDTO;
import com.example.gestor_inversores.model.Project;
import com.example.gestor_inversores.model.ProjectDocument;
import com.example.gestor_inversores.repository.IProjectDocumentRepository;
import com.example.gestor_inversores.repository.IProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectDocumentService implements IProjectDocumentService {

    private final IProjectDocumentRepository documentRepository;
    private final IProjectRepository projectRepository;

    private final String uploadFolder = System.getProperty("user.home") + "/Desktop/projects/files/";

    @Transactional
    @Override
    public ResponseProjectDocumentDTO saveFile(MultipartFile file, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        try {
            File folder = new File(uploadFolder);
            if (!folder.exists()) folder.mkdirs();

            String filePath = uploadFolder + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            File dest = new File(filePath);
            file.transferTo(dest);

            ProjectDocument document = new ProjectDocument();
            document.setFileName(file.getOriginalFilename());
            document.setFilePath(filePath);
            document.setProject(project);

            ProjectDocument saved = documentRepository.save(document);

            return ResponseProjectDocumentDTO.builder()
                    .idProjectDocument(saved.getIdProjectDocument())
                    .fileName(saved.getFileName())
                    .filePath(saved.getFilePath())
                    .projectId(saved.getProject().getIdProject())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Could not store file: " + e.getMessage());
        }
    }

    @Override
    public List<ResponseProjectDocumentDTO> getAllByProject(Long projectId) {
        return documentRepository.findByProject_IdProject(projectId).stream().map(d ->
                ResponseProjectDocumentDTO.builder()
                        .idProjectDocument(d.getIdProjectDocument())
                        .fileName(d.getFileName())
                        .filePath(d.getFilePath())
                        .projectId(d.getProject().getIdProject())
                        .build()
        ).toList();
    }

    @Override
    public ResponseProjectDocumentDTO findById(Long id) {
        ProjectDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        return ResponseProjectDocumentDTO.builder()
                .idProjectDocument(doc.getIdProjectDocument())
                .fileName(doc.getFileName())
                .filePath(doc.getFilePath())
                .projectId(doc.getProject().getIdProject())
                .build();
    }


    @Transactional
    @Override
    public void delete(Long id) {
        documentRepository.deleteById(id);
    }
}
