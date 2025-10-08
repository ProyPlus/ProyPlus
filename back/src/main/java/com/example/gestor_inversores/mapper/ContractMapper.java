package com.example.gestor_inversores.mapper;

import com.example.gestor_inversores.dto.ContractActionDTO;
import com.example.gestor_inversores.dto.RequestContractUpdateByInvestorDTO;
import com.example.gestor_inversores.dto.ResponseContractDTO;
import com.example.gestor_inversores.model.Contract;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ContractMapper {

    private final ContractActionMapper actionMapper;

    public ContractMapper(ContractActionMapper actionMapper) {
        this.actionMapper = actionMapper;
    }

    public ResponseContractDTO toResponseDTO(Contract contract) {
        return ResponseContractDTO.builder()
                .idContract(contract.getIdContract())
                .projectId(contract.getProject() != null ? contract.getProject().getIdProject() : null)
                .createdByInvestorId(contract.getCreatedByInvestor() != null ? contract.getCreatedByInvestor().getId() : null)
                .amount(contract.getAmount())
                .currency(contract.getCurrency())
                .status(contract.getStatus())
                .createdAt(contract.getCreatedAt())
                .profit1Year(contract.getProfit1Year())
                .profit2Years(contract.getProfit2Years())
                .profit3Years(contract.getProfit3Years())
                .actions(contract.getActions() != null
                        ? contract.getActions().stream()
                        .map(a -> ContractActionDTO.builder()
                                .studentId(a.getStudent().getId())
                                .status(a.getStatus())
                                .actionDate(a.getActionDate())
                                .build())
                        .toList()
                        : List.of())
                .build();
    }


    public void updateContractByInvestor(RequestContractUpdateByInvestorDTO dto, Contract contract) {
        if (dto.getAmount() != null) contract.setAmount(dto.getAmount());
        if (dto.getCurrency() != null) contract.setCurrency(dto.getCurrency());
        if (dto.getProfit1Year() != null) contract.setProfit1Year(dto.getProfit1Year());
        if (dto.getProfit2Years() != null) contract.setProfit2Years(dto.getProfit2Years());
        if (dto.getProfit3Years() != null) contract.setProfit3Years(dto.getProfit3Years());
    }
}
