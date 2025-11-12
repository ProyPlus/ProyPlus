package com.example.gestor_inversores.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "investors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Investor extends User {

    @NotBlank(message = "CUIT es obligatorio")
    @Column(nullable = false, unique = true)
    @Size(min = 11, max = 11, message = "CUIT debe tener 11 caracteres")
    private String cuit;

    @NotBlank(message = "Nombre del contacto es obligatorio")
    private String contactPerson;

    @NotBlank(message = "Teléfono es obligatorio")
    @Pattern(regexp = "\\+?\\d{8,15}", message = "Teléfono inválido")
    private String phone;

    @Size(max = 100, message = "El sitio web no puede superar 100 caracteres")
    private String webSite;

    @Pattern(regexp = "^(https?://.*|linkedin\\.com/.*)?$", message = "Si se proporciona, debe ser una URL válida")
    private String linkedinUrl;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "address_id",referencedColumnName = "idAddress")
    private Address address;

    @OneToMany(mappedBy = "confirmedBy")
    private Set<Earning> confirmedEarnings = new HashSet<>();

    @OneToMany(mappedBy = "generatedBy", cascade = CascadeType.ALL)
    private Set<Investment> investments = new HashSet<>();

}
