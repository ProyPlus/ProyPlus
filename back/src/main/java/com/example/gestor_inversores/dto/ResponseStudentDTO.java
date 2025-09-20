package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.enums.DegreeStatus;
import com.example.gestor_inversores.model.enums.University;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResponseStudentDTO {

    private Long id;
    private String username;
    private String email;
    private String photoUrl;
    private Boolean enabled;
    private Boolean accountNotExpired;
    private Boolean accountNotLocked;
    private Boolean credentialNotExpired;

    private String firstName;
    private String lastName;
    private String dni;
    private String phone;
    private LocalDate dateOfBirth;
    private University university;
    private String career;
    private DegreeStatus degreeStatus;
    private String linkedinUrl;
    private String description;

    private AddressDTO address;
    private Set<ProjectDTO> projects;
    private Set<RoleDTO> roles;
}
