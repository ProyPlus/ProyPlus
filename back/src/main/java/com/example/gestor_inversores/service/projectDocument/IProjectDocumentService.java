package com.example.gestor_inversores.service.projectDocument;

import com.example.gestor_inversores.dto.RequestProjectDocumentDTO;
import com.example.gestor_inversores.dto.ResponseProjectDocumentDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IProjectDocumentService {

    ResponseProjectDocumentDTO saveFile(MultipartFile file, Long projectId);
    List<ResponseProjectDocumentDTO> getAllByProject(Long projectId);
    void delete(Long id);
    ResponseProjectDocumentDTO findById(Long id);



}
