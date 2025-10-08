package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.enums.ContractStatus;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractActionDTO {

    private Long id;             // opcional, para retorno
    private Long contractId;
    private Long studentId;
    private ContractStatus status;
    private LocalDate actionDate; // puede ser generado automáticamente
}

