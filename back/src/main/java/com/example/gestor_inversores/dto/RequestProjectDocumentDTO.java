package com.example.gestor_inversores.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RequestProjectDocumentDTO {

    @NotNull(message = "El projectId es obligatorio")
    private Long projectId;
}
