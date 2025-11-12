package com.example.gestor_inversores.mapper;

import com.example.gestor_inversores.dto.RequestContractUpdateByInvestorDTO;
import com.example.gestor_inversores.dto.RequestContractUpdateByStudentDTO;
import com.example.gestor_inversores.dto.ResponseContractDTO;
import com.example.gestor_inversores.dto.ResponseInvestmentDTO;
import com.example.gestor_inversores.model.Contract;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class ContractMapper {

    private final ContractActionMapper actionMapper;
    private final InvestmentMapper investmentMapper;

    public ContractMapper(ContractActionMapper actionMapper, InvestmentMapper investmentMapper) {
        this.actionMapper = actionMapper;
        this.investmentMapper = investmentMapper;
    }

    public ResponseContractDTO toResponseDTO(Contract contract) {
        return ResponseContractDTO.builder()
                .idContract(contract.getIdContract())
                .projectId(contract.getProject() != null ? contract.getProject().getIdProject() : null)
                .createdByInvestorId(contract.getCreatedByInvestor() != null ? contract.getCreatedByInvestor().getId() : null)
                .investment(contract.getInvestment() != null ? investmentMapper.toResponse(contract.getInvestment()) : null)
                .textTitle(contract.getTextTitle())
                .description(contract.getDescription())
                .amount(contract.getAmount())
                .currency(contract.getCurrency())
                .status(contract.getStatus())
                .createdAt(contract.getCreatedAt())
                .investorSigned(contract.isInvestorSigned())
                .investorSignedDate(contract.getInvestorSignedDate())
                .studentSigned(contract.isStudentSigned())
                .studentSignedDate(contract.getStudentSignedDate())
                .profit1Year(contract.getProfit1Year())
                .profit2Years(contract.getProfit2Years())
                .profit3Years(contract.getProfit3Years())
                .actions(contract.getActions() != null
                        ? contract.getActions().stream().map(actionMapper::toDTO).collect(Collectors.toList())
                        : null)
                .build();
    }


    public void updateContractByInvestor(RequestContractUpdateByInvestorDTO dto, Contract contract) {
        if (dto.getTextTitle() != null) contract.setTextTitle(dto.getTextTitle());
        if (dto.getDescription() != null) contract.setDescription(dto.getDescription());
        if (dto.getAmount() != null) contract.setAmount(dto.getAmount());
        if (dto.getCurrency() != null) contract.setCurrency(dto.getCurrency());
        if (dto.getProfit1Year() != null) contract.setProfit1Year(dto.getProfit1Year());
        if (dto.getProfit2Years() != null) contract.setProfit2Years(dto.getProfit2Years());
        if (dto.getProfit3Years() != null) contract.setProfit3Years(dto.getProfit3Years());
    }

    public void updateContractByStudent(RequestContractUpdateByStudentDTO dto, Contract contract) {
        if (dto.getTextTitle() != null) contract.setTextTitle(dto.getTextTitle());
        if (dto.getDescription() != null) contract.setDescription(dto.getDescription());
        if (dto.getAmount() != null) contract.setAmount(dto.getAmount());
        if (dto.getProfit1Year() != null) contract.setProfit1Year(dto.getProfit1Year());
        if (dto.getProfit2Years() != null) contract.setProfit2Years(dto.getProfit2Years());
        if (dto.getProfit3Years() != null) contract.setProfit3Years(dto.getProfit3Years());
    }
}
