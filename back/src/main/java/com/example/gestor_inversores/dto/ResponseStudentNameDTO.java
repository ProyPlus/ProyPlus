package com.example.gestor_inversores.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResponseStudentNameDTO {

    private Long id;
    private String firstName;
    private String lastName;
}
