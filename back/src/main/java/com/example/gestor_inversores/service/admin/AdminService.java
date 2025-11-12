package com.example.gestor_inversores.service.admin;

import com.example.gestor_inversores.dto.*;
import com.example.gestor_inversores.exception.*;
import com.example.gestor_inversores.mapper.*;
import com.example.gestor_inversores.model.*;
import com.example.gestor_inversores.model.enums.Currency;
import com.example.gestor_inversores.model.enums.ContractStatus;
import com.example.gestor_inversores.model.enums.EarningStatus;
import com.example.gestor_inversores.model.enums.InvestmentStatus;
import com.example.gestor_inversores.model.enums.ProjectStatus;
import com.example.gestor_inversores.model.enums.InvestmentStatus;
import com.example.gestor_inversores.repository.*;
import com.example.gestor_inversores.service.earning.IEarningService;
import com.example.gestor_inversores.service.currency.CurrencyConversionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AdminService implements IAdminService {

    private final IProjectRepository projectRepository;
    private final IContractRepository contractRepository;
    private final IEarningRepository earningRepository;
    private final IInvestmentRepository investmentRepository;

    private final AdminMapper adminMapper;
    private final ContractMapper contractMapper;
    private final EarningMapper earningMapper;
    private final InvestmentMapper investmentMapper;
    private final IEarningService earningService;

    private final CurrencyConversionService currencyConversionService;

    @Override
    @Transactional
    public ResponseProjectDTO adminUpdateProject(Long projectId, RequestAdminProjectUpdateDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Proyecto no encontrado con ID: " + projectId));

        // VALIDACIÓN: Si se intenta completar el proyecto, asegurar que la meta de financiación se haya alcanzado.
        if (dto.getStatus() == ProjectStatus.COMPLETED && project.getCurrentGoal().compareTo(project.getBudgetGoal()) < 0) {
            throw new BusinessException(String.format(
                "No se puede marcar el proyecto como 'COMPLETADO' porque no ha alcanzado su meta de financiación (Recaudado: %.2f, Meta: %.2f).",
                project.getCurrentGoal(), project.getBudgetGoal()
            ));
        }

        if (dto.getEstimatedEndDate().isBefore(dto.getStartDate())) {
            throw new InvalidProjectException("La fecha de finalización estimada no puede ser anterior a la fecha de inicio");
        }

        adminMapper.updateProjectFromDto(dto, project);
        Project updatedProject = projectRepository.save(project);
        return ProjectMapper.projectToResponseProjectDTO(updatedProject);
    }

    @Override
    @Transactional
    public ResponseContractDTO adminUpdateContract(Long contractId, RequestAdminContractUpdateDTO dto) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contrato no encontrado con ID: " + contractId));
 
        ContractStatus oldStatus = contract.getStatus();

        ContractStatus newStatus = dto.getStatus(); // Leemos el estado DESPUÉS de la posible modificación.

        // --- Lógica de Negocio para Cambios de Estado ---
        if (newStatus != null && oldStatus != newStatus) {
            // REGLA: Si un contrato firmado o cerrado se revierte a un estado anterior (borrador o cancelado)...
            if ((oldStatus == ContractStatus.SIGNED || oldStatus == ContractStatus.CLOSED) &&
                (newStatus == ContractStatus.DRAFT || newStatus == ContractStatus.CANCELLED)) {

                Investment investment = contract.getInvestment();
                if (investment != null) {
                    // ...y la inversión ya había sido recibida, debemos revertir los fondos del proyecto.
                    if (investment.getStatus() == InvestmentStatus.RECEIVED) {
                        Project project = investment.getProject();
                        BigDecimal amountInUSD = investment.getAmount();
                        if (investment.getCurrency() != Currency.USD) {
                            amountInUSD = currencyConversionService
                                    .getConversionRate(investment.getCurrency().name(), "USD")
                                    .getRate()
                                    .multiply(investment.getAmount());
                        }
                        BigDecimal newCurrentGoal = project.getCurrentGoal().subtract(amountInUSD);
                        project.setCurrentGoal(newCurrentGoal.max(BigDecimal.ZERO));
                        projectRepository.save(project);
                        System.out.println(String.format(
                            "Acción de Administrador: Reversión de fondos por cambio de contrato. Se descontaron %.2f USD del proyecto %d.",
                            amountInUSD, project.getIdProject()));
                    }
                    // ...y en cualquier caso, la inversión asociada se cancela.
                    investment.setStatus(InvestmentStatus.CANCELLED);
                    investmentRepository.save(investment);
                }
            // REGLA: Si un contrato pasa a estar FIRMADO por acción del admin...
            } else if (newStatus == ContractStatus.SIGNED && oldStatus != ContractStatus.SIGNED) {
                // ...y no tiene una inversión asociada, debemos crearla.
                if (contract.getInvestment() == null) {
                    Investment newInvestment = new Investment();
                    newInvestment.setProject(contract.getProject());
                    newInvestment.setGeneratedBy(contract.getCreatedByInvestor());
                    newInvestment.setContract(contract);
                    newInvestment.setAmount(contract.getAmount());
                    newInvestment.setCurrency(contract.getCurrency());
                    newInvestment.setStatus(InvestmentStatus.IN_PROGRESS); // Estado inicial de una inversión
                    newInvestment.setCreatedAt(LocalDate.now());
                    investmentRepository.save(newInvestment);
                    contract.setInvestment(newInvestment); // Asociamos la nueva inversión al contrato
                    System.out.println(String.format(
                        "Acción de Administrador: Creación de inversión %d para contrato %d forzado a SIGNED.",
                        newInvestment.getIdInvestment(), contract.getIdContract()));
                }
            // REGLA: Si un contrato pasa a estar CERRADO por acción del admin...
            } else if (newStatus == ContractStatus.CLOSED && oldStatus != ContractStatus.CLOSED) {
                // ...y tiene una inversión asociada, debemos generar las ganancias.
                Investment investment = contract.getInvestment();
                if (investment != null) {
                    earningService.createFromContract(contract, contract.getProject().getOwner());
                    System.out.println(String.format(
                        "Acción de Administrador: Generación de ganancias para contrato %d forzado a CLOSED.",
                        contract.getIdContract()));

                    // LÓGICA AÑADIDA: Si la inversión fue recibida, se marca como completada.
                    if (investment.getStatus() == InvestmentStatus.RECEIVED) {
                        investment.setStatus(InvestmentStatus.COMPLETED);
                        investmentRepository.save(investment);
                    }
                }
            // REGLA: Si un contrato pasa a estar REEMBOLSADO por acción del admin...
            } else if (newStatus == ContractStatus.REFUNDED && oldStatus != ContractStatus.REFUNDED) {
                // ...y tiene una inversión asociada, debemos iniciar el proceso de devolución.
                if (contract.getInvestment() != null) {
                    contract.getInvestment().setStatus(InvestmentStatus.PENDING_RETURN);
                    investmentRepository.save(contract.getInvestment());
                }
            }
        }

        adminMapper.updateContractFromDto(dto, contract);
        Contract updatedContract = contractRepository.save(contract);
        return contractMapper.toResponseDTO(updatedContract);
    }

    @Override
    @Transactional
    public ResponseInvestmentDTO adminUpdateInvestment(Long investmentId, RequestAdminInvestmentUpdateDTO dto) {
        Investment investment = investmentRepository.findById(investmentId)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada con ID: " + investmentId));

        InvestmentStatus oldStatus = investment.getStatus();
        InvestmentStatus newStatus = dto.getStatus();

        // Lógica de ajuste financiero solo si el estado cambia.
        if (newStatus != null && oldStatus != newStatus) {
            // Caso 1: Se revierte una inversión que estaba como RECIBIDA.
            if (oldStatus == InvestmentStatus.RECEIVED) {
                Project project = investment.getProject();
                BigDecimal amountInUSD = investment.getAmount();
                if (investment.getCurrency() != Currency.USD) {
                    amountInUSD = currencyConversionService
                            .getConversionRate(investment.getCurrency().name(), "USD")
                            .getRate()
                            .multiply(investment.getAmount());
                }
                BigDecimal newCurrentGoal = project.getCurrentGoal().subtract(amountInUSD);
                project.setCurrentGoal(newCurrentGoal.max(BigDecimal.ZERO));
                projectRepository.save(project);
                System.out.println(String.format(
                    "Acción de Administrador: Reversión de fondos. Se descontaron %.2f USD del proyecto %d.",
                    amountInUSD, project.getIdProject()));
            // Caso 2: Se marca como RECIBIDA una inversión que no lo estaba.
            } else if (newStatus == InvestmentStatus.RECEIVED) {
                Project project = investment.getProject();
                BigDecimal amountInUSD = investment.getAmount();
                if (investment.getCurrency() != Currency.USD) {
                    amountInUSD = currencyConversionService
                            .getConversionRate(investment.getCurrency().name(), "USD")
                            .getRate()
                            .multiply(investment.getAmount());
                }
                BigDecimal potentialNewGoal = project.getCurrentGoal().add(amountInUSD);
                if (potentialNewGoal.compareTo(project.getBudgetGoal()) > 0) {
                    throw new BusinessException(String.format(
                        "La acción no se puede completar. El monto de la inversión (%.2f USD) haría que el proyecto supere su meta de financiación (%.2f USD).",
                        amountInUSD, project.getBudgetGoal()));
                }
                project.setCurrentGoal(potentialNewGoal);
                projectRepository.save(project);
                System.out.println(String.format(
                    "Acción de Administrador: Aporte de fondos. Se sumaron %.2f USD al proyecto %d.",
                    amountInUSD, project.getIdProject()));
            } 
        }

        // Se actualiza el estado y la fecha de confirmación directamente en el servicio.
        if (newStatus != null) {
            investment.setStatus(newStatus);
            if (newStatus == InvestmentStatus.RECEIVED) {
                investment.setConfirmedAt(LocalDate.now());
            } else {
                // Si el nuevo estado no es RECEIVED, nos aseguramos de anular la fecha de confirmación.
                investment.setConfirmedAt(null);
            }
        }

        Investment updatedInvestment = investmentRepository.save(investment);
        return investmentMapper.toResponse(updatedInvestment); // Asegúrate que tu InvestmentMapper se llame 'toResponse'
    }

    @Override
    @Transactional
    public ResponseEarningDTO adminUpdateEarningStatus(Long earningId, RequestAdminUpdateEarningStatusDTO dto) {
        Earning earning = earningRepository.findById(earningId)
                .orElseThrow(() -> new EarningNotFoundException("Ganancia no encontrada con ID: " + earningId));

        System.out.println(String.format(
            "Acción de Administrador: Cambiando estado de ganancia %d de %s a %s.",
            earningId,
            earning.getStatus(), // old status
            dto.getStatus() // new status from DTO
        ));

        earning.setStatus(dto.getStatus());

        // Lógica adicional: si el estado es RECEIVED, se confirma la fecha. Si no, se anula.
        if (dto.getStatus() == EarningStatus.RECEIVED) {
            earning.setConfirmedAt(LocalDate.now());
        } else {
            earning.setConfirmedAt(null);
        }
        Earning updatedEarning = earningRepository.save(earning);
        return earningMapper.toResponse(updatedEarning);
    }
}
