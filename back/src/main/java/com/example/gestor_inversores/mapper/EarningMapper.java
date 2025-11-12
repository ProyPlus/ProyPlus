package com.example.gestor_inversores.mapper;

import com.example.gestor_inversores.dto.ResponseEarningDTO;
import com.example.gestor_inversores.model.Earning;
import org.springframework.stereotype.Component;

@Component
public class EarningMapper {

    private static final int MAX_RETRIES = 3;

    public ResponseEarningDTO toResponse(Earning e) {
        ResponseEarningDTO dto = new ResponseEarningDTO();
        dto.setIdEarning(e.getIdEarning());
        dto.setAmount(e.getAmount());
        dto.setBaseAmount(e.getBaseAmount());
        dto.setProfitRate(e.getProfitRate());
        dto.setProfitAmount(e.getProfitAmount());
        dto.setCurrency(e.getCurrency());
        dto.setStatus(e.getStatus());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setConfirmedAt(e.getConfirmedAt());
        dto.setContractId(e.getContract().getIdContract());
        dto.setProjectId(e.getProject().getIdProject());
        dto.setGeneratedById(e.getGeneratedBy().getId());
        dto.setConfirmedById(e.getConfirmedBy() != null ? e.getConfirmedBy().getId() : null);

        // Calcular y establecer los reintentos restantes
        int retriesLeft = MAX_RETRIES - e.getRetryCount();
        dto.setRetriesLeft(retriesLeft);

        return dto;
    }

    // Sobrecarga del método para mantener compatibilidad si se necesita
    public ResponseEarningDTO toDTO(Earning earning) {
        return toResponse(earning);
    }
}
