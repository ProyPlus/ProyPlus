package com.example.gestor_inversores.mapper;

import com.example.gestor_inversores.dto.ContractActionDTO;
import com.example.gestor_inversores.model.Contract;
import com.example.gestor_inversores.model.ContractAction;
import com.example.gestor_inversores.model.Student;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class ContractActionMapper {

    public ContractAction toEntity(ContractActionDTO dto, Contract contract, Student student) {
        return ContractAction.builder()
                .contract(contract)
                .student(student)
                .status(dto.getStatus())
                .actionDate(dto.getActionDate() != null ? dto.getActionDate() : LocalDate.now())
                .build();
    }

    public ContractActionDTO toDTO(ContractAction action) {
        return ContractActionDTO.builder()
                .id(action.getId())
                .contractId(action.getContract().getIdContract())
                .studentId(action.getStudent().getId())
                .status(action.getStatus())
                .actionDate(action.getActionDate())
                .build();
    }
}

