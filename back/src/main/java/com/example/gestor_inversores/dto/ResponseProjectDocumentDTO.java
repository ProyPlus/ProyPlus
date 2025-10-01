package com.example.gestor_inversores.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ResponseProjectDocumentDTO {
    private Long idProjectDocument;
    private String fileName;
    private String filePath;
    private Long projectId;
}
