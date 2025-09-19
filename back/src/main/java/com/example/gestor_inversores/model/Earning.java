package com.example.gestor_inversores.model;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.example.gestor_inversores.model.enums.Currency;
import com.example.gestor_inversores.model.enums.EarningStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "earnings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Earning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idEarning;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "El estado de la ganancia es obligatorio")
    private EarningStatus status;

    @Column(nullable = false, precision = 15, scale = 2)
    @NotNull(message = "El monto no puede ser nulo")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "La moneda es obligatoria")
    @Column(nullable = false)
    private Currency currency;

    private LocalDate createdAt;
    private LocalDate confirmedAt;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    @NotNull(message = "El proyecto es obligatorio")
    private Project project;

    @ManyToOne
    @JoinColumn(name = "generated_by_id", nullable = false)
    @NotNull(message = "El estudiante generador es obligatorio")
    private Student generatedBy;

    @ManyToOne
    @JoinColumn(name = "confirmed_by_id")
    private Investor confirmedBy;

}
