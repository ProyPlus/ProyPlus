package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.enums.Currency;
import com.example.gestor_inversores.model.enums.ContractStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResponseContractDTO {

    private Long idContract;
    private Long projectId;
    private Long createdByInvestorId;
    private ResponseInvestmentDTO investment; // Cambiado de Long a InvestmentDTO

    private String textTitle;

    private String description;

    private BigDecimal amount;
    private Currency currency;
    private ContractStatus status;

    private LocalDate createdAt;

    // Campos de firma
    private boolean investorSigned;
    private LocalDate investorSignedDate;
    private boolean studentSigned;
    private LocalDate studentSignedDate;

    private BigDecimal profit1Year;
    private BigDecimal profit2Years;
    private BigDecimal profit3Years;

    private List<ContractActionDTO> actions; // historial de acciones del estudiante
}
