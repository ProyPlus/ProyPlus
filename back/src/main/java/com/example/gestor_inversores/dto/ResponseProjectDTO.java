package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.enums.ProjectStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResponseProjectDTO {

    private Long id;
    private String name;
    private String description;
    private BigDecimal budgetGoal;
    private BigDecimal currentGoal;
    private ProjectStatus status;
    private LocalDate startDate;
    private LocalDate estimatedEndDate;
    private LocalDate endDate;
    private Long ownerId;
    private String ownerName; // opcional
    private String tagName;

    // Lista de participantes
    private List<ResponseProjectStudentDTO> students;
    private Boolean deleted;

}
