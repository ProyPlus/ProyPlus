package com.example.gestor_inversores.mapper;

import com.example.gestor_inversores.dto.RequestAdminContractUpdateDTO;
import com.example.gestor_inversores.dto.RequestAdminInvestmentUpdateDTO;
import com.example.gestor_inversores.dto.RequestAdminProjectUpdateDTO;
import com.example.gestor_inversores.model.Contract;
import com.example.gestor_inversores.model.Investment;
import com.example.gestor_inversores.model.Project;
import org.springframework.stereotype.Component;

@Component
public class AdminMapper {

    public void updateProjectFromDto(RequestAdminProjectUpdateDTO dto, Project project) {
        if (dto.getName() != null) project.setName(dto.getName());
        if (dto.getDescription() != null) project.setDescription(dto.getDescription());
        if (dto.getBudgetGoal() != null) project.setBudgetGoal(dto.getBudgetGoal());
        if (dto.getStatus() != null) project.setStatus(dto.getStatus());
        if (dto.getStartDate() != null) project.setStartDate(dto.getStartDate());
        if (dto.getEstimatedEndDate() != null) project.setEstimatedEndDate(dto.getEstimatedEndDate());
        if (dto.getEndDate() != null) project.setEndDate(dto.getEndDate());
        if (dto.getDeleted() != null) project.setDeleted(dto.getDeleted());
    }

    public void updateContractFromDto(RequestAdminContractUpdateDTO dto, Contract contract) {
        if (dto.getStatus() != null) contract.setStatus(dto.getStatus());
    }
}
