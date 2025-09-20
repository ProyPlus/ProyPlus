package com.example.gestor_inversores.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResponseInvestorDTO {

    private Long id;
    private String username;
    private String email;
    private String photoUrl;
    private Boolean enabled;
    private Boolean accountNotExpired;
    private Boolean accountNotLocked;
    private Boolean credentialNotExpired;

    private String cuit;

    private String contactPerson;

    private String phone;

    private String webSite;

    private AddressDTO address;


}
