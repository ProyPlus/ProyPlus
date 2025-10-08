package com.example.gestor_inversores.model;

import com.example.gestor_inversores.model.enums.ContractStatus;
import com.example.gestor_inversores.model.enums.Currency;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "contracts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idContract;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    @NotNull(message = "El proyecto asociado es obligatorio")
    private Project project;

    @ManyToOne
    @JoinColumn(name = "created_by_investor_id", nullable = false)
    @NotNull(message = "El inversor creador es obligatorio")
    private Investor createdByInvestor;

    @Column(nullable = false, precision = 15, scale = 2)
    @NotNull(message = "El monto de la inversión es obligatorio")
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "La moneda es obligatoria")
    @Column(nullable = false)
    private Currency currency;

    @Enumerated(EnumType.STRING)
    @NotNull
    private ContractStatus status;

    private LocalDate createdAt;

    /**
     * Porcentajes de ganancia según duración del proyecto
     */
    @DecimalMin(value = "0.00", message = "El porcentaje de ganancias debe ser mayor o igual a 0")
    private BigDecimal profit1Year;

    @DecimalMin(value = "0.00", message = "El porcentaje de ganancias debe ser mayor o igual a 0")
    private BigDecimal profit2Years;

    @DecimalMin(value = "0.00", message = "El porcentaje de ganancias debe ser mayor o igual a 0")
    private BigDecimal profit3Years;

    /**
     * Relación con ContractAction para registrar todas las acciones de los estudiantes
     */
    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ContractAction> actions = new ArrayList<>();

    /**
     * Relación con la inversión asociada al contrato
     */
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "investment_id")
    private Investment investment;
}
