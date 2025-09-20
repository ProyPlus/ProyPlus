package com.example.gestor_inversores.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Set;

@Getter
@Setter
public class PatchStudentDTO {

    private String username;
    private String email;
    private String photoUrl;

    // Campos específicos de Student
    private String firstName;
    private String lastName;
    private String dni;
    private String phone;
    private LocalDate dateOfBirth;
    private String career;
    private String linkedinUrl;
    private String description;

    // Dirección opcional para patch
    private AddressDTO address;

}
