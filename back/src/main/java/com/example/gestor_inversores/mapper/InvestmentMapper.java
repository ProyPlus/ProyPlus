package com.example.gestor_inversores.mapper;

import com.example.gestor_inversores.dto.RequestInvestmentDetailsDTO;
import com.example.gestor_inversores.dto.RequestInvestmentStatusDTO;
import com.example.gestor_inversores.dto.RequestInvestmentUpdateDTO;
import com.example.gestor_inversores.dto.ResponseInvestmentDTO;
import com.example.gestor_inversores.model.Investment;
import com.example.gestor_inversores.model.Student;
import com.example.gestor_inversores.model.enums.InvestmentStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class InvestmentMapper {

    public ResponseInvestmentDTO toResponse(Investment inv) {
        ResponseInvestmentDTO dto = new ResponseInvestmentDTO();
        dto.setIdInvestment(inv.getIdInvestment());
        dto.setStatus(inv.getStatus());
        dto.setAmount(inv.getAmount());
        dto.setCurrency(inv.getCurrency());
        dto.setCreatedAt(inv.getCreatedAt());
        dto.setConfirmedAt(inv.getConfirmedAt());
        dto.setGeneratedById(inv.getGeneratedBy().getId());
        dto.setProjectId(inv.getProject().getIdProject());
        dto.setConfirmedByStudentId(inv.getConfirmedBy() != null ? inv.getConfirmedBy().getId() : null);
        return dto;
    }

    public void updateInvestmentFromDetailsDTO(RequestInvestmentDetailsDTO dto, Investment inv) {
        if (dto.getAmount() != null) inv.setAmount(dto.getAmount());
        if (dto.getCurrency() != null) inv.setCurrency(dto.getCurrency());
    }

    public void updateInvestmentStatus(RequestInvestmentStatusDTO dto, Investment inv, Student student) {
        if (dto.getStatus() != null &&
                (dto.getStatus() == InvestmentStatus.RECEIVED || dto.getStatus() == InvestmentStatus.NOT_RECEIVED)) {
            inv.setStatus(dto.getStatus());
            inv.setConfirmedBy(student);
            inv.setConfirmedAt(LocalDate.now());
        }
    }


}