package com.example.gestor_inversores.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PatchInvestorDTO {

    @Size(min = 3, max = 50)
    private String username;

    @Size(min = 4)
    private String password;

    @Email
    private String email;

    private String photoUrl;

    @Pattern(regexp = "\\+?\\d{8,15}")
    private String phone;

    @Size(max = 100)
    private String webSite;

    private AddressDTO address;
}
