package com.example.gestor_inversores.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestContractActionByStudentDTO {

    private Long studentId; // El estudiante que realiza la acción

}
