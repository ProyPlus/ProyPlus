package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.enums.EarningStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequestAdminUpdateEarningStatusDTO {
    private EarningStatus status;
}
