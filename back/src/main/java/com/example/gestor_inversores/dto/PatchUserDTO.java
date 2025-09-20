package com.example.gestor_inversores.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class PatchUserDTO {
    private String username;
    private String email;
    private String photoUrl;

    // Campos de seguridad opcionales
    private Boolean enabled;
    private Boolean accountNotExpired;
    private Boolean accountNotLocked;
    private Boolean credentialNotExpired;

    private Set<Long> rolesIds;
}

