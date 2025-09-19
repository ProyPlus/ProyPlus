package com.example.gestor_inversores.model;

import com.example.gestor_inversores.model.enums.Province;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idAddress;

    @NotBlank(message = "La calle no puede estar vacía")
    private String street;

    @Positive(message = "El número debe ser positivo")
    private int number;

    @NotBlank(message = "La ciudad no puede estar vacía")
    private String city;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "La provincia es obligatoria")
    @Column(nullable = false)
    private Province province;

    @Positive(message = "El código postal debe ser positivo")
    private int postalCode;

    @OneToOne(mappedBy = "address")
    private Investor investor;

    @OneToOne(mappedBy = "address")
    private Student student;

}
