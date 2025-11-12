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
    @NotNull
    private EarningStatus status;

    @Column(nullable = false, precision = 15, scale = 2)
    @NotNull
    @DecimalMin("0.01")
    private BigDecimal amount; // total: base + profit

    @Column(nullable = false, precision = 15, scale = 2)
    @NotNull
    private BigDecimal baseAmount; // inversión inicial del contrato

    @Column(nullable = false, precision = 5, scale = 4)
    @NotNull
    private BigDecimal profitRate; // ej. 0.06

    @Column(nullable = false, precision = 15, scale = 2)
    @NotNull
    private BigDecimal profitAmount; // ganancia calculada

    @Enumerated(EnumType.STRING)
    @NotNull
    private Currency currency;

    private LocalDate createdAt;
    private LocalDate confirmedAt;

    @Column(nullable = false)
    private int retryCount = 0;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    @NotNull
    private Project project;

    @ManyToOne
    @JoinColumn(name = "generated_by_id", nullable = false)
    @NotNull
    private Student generatedBy;

    @ManyToOne
    @JoinColumn(name = "confirmed_by_id")
    private Investor confirmedBy;

    @OneToOne
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;
}
