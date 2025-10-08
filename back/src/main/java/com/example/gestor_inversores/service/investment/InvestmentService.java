package com.example.gestor_inversores.service.investment;

import com.example.gestor_inversores.dto.*;
import com.example.gestor_inversores.exception.*;
import com.example.gestor_inversores.mapper.*;
import com.example.gestor_inversores.model.*;
import com.example.gestor_inversores.model.enums.Currency;
import com.example.gestor_inversores.model.enums.InvestmentStatus;
import com.example.gestor_inversores.model.enums.ContractStatus;
import com.example.gestor_inversores.repository.*;
import com.example.gestor_inversores.service.currency.CurrencyConversionService;
import com.example.gestor_inversores.service.contract.ContractService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class InvestmentService implements IInvestmentService {

    @Autowired
    private IInvestmentRepository investmentRepo;

    @Autowired
    private IProjectRepository projectRepo;

    @Autowired
    private IStudentRepository studentRepo;

    @Autowired
    private IInvestorRepository investorRepo;

    @Autowired
    private InvestmentMapper mapper;

    @Autowired
    private CurrencyConversionService currencyConversionService;

    @Autowired
    @Lazy // Para evitar circular dependency con ContractService
    private ContractService contractService;

    @Override
    public ResponseInvestmentDTO create(RequestInvestmentDTO dto) {
        Investor investor = investorRepo.findById(dto.getGeneratedById())
                .orElseThrow(() -> new InvestorNotFoundException("Inversor no encontrado"));

        Project project = projectRepo.findById(dto.getProjectId())
                .orElseThrow(() -> new ProjectNotFoundException("Proyecto no encontrado"));

        Investment inv = new Investment();
        inv.setAmount(dto.getAmount());
        inv.setCurrency(dto.getCurrency());
        inv.setGeneratedBy(investor);
        inv.setProject(project);
        inv.setStatus(InvestmentStatus.IN_PROGRESS);
        inv.setCreatedAt(LocalDate.now());

        return mapper.toResponse(investmentRepo.save(inv));
    }

    @Override
    public ResponseInvestmentDTO updateDetails(Long id, RequestInvestmentDetailsDTO dto) {
        Investment inv = investmentRepo.findByIdInvestmentAndDeletedFalse(id)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada"));

        if (inv.getStatus() != InvestmentStatus.IN_PROGRESS) {
            throw new UpdateException("No se pueden modificar detalles después de la confirmación del estudiante");
        }

        mapper.updateInvestmentFromDetailsDTO(dto, inv);
        return mapper.toResponse(investmentRepo.save(inv));
    }

    @Override
    public ResponseInvestmentDTO confirmByStudent(Long id, Long studentId, InvestmentStatus status) {
        Investment inv = investmentRepo.findByIdInvestmentAndDeletedFalse(id)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada"));

        Student student = studentRepo.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException("Estudiante no encontrado"));

        if (inv.getStatus() == InvestmentStatus.RECEIVED || inv.getStatus() == InvestmentStatus.NOT_RECEIVED) {
            throw new UpdateException("Esta inversión ya fue confirmada y no se puede modificar nuevamente.");
        }

        if (status != InvestmentStatus.RECEIVED && status != InvestmentStatus.NOT_RECEIVED) {
            throw new UpdateException("Estado inválido para confirmación");
        }

        inv.setStatus(status);
        inv.setConfirmedBy(student);
        inv.setConfirmedAt(LocalDate.now());
        Investment updatedInvestment = investmentRepo.save(inv);

        // ⚡ Ajuste del currentGoal si es RECEIVED
        if (status == InvestmentStatus.RECEIVED) {
            Project project = updatedInvestment.getProject();

            BigDecimal amountInUSD = updatedInvestment.getAmount();
            if (updatedInvestment.getCurrency() != Currency.USD) {
                amountInUSD = currencyConversionService
                        .getConversionRate(updatedInvestment.getCurrency().name(), "USD")
                        .getRate()
                        .multiply(updatedInvestment.getAmount());
            }

            BigDecimal newCurrentGoal = project.getCurrentGoal().add(amountInUSD);

            RequestProjectCurrentGoalUpdateDTO dto = new RequestProjectCurrentGoalUpdateDTO();
            dto.setCurrentGoal(newCurrentGoal);

            ProjectMapper.requestProjectCurrentGoalUpdateToProject(dto, project);
            projectRepo.save(project);
        }

        // ⚡ Auto-cancelar contrato si estudiante marca NOT_RECEIVED
        if (status == InvestmentStatus.NOT_RECEIVED) {
            autoCancelContractIfNeeded(updatedInvestment);
        }

        return mapper.toResponse(updatedInvestment);
    }

    @Override
    public ResponseInvestmentDTO cancelByInvestor(Long id) {
        Investment inv = investmentRepo.findByIdInvestmentAndDeletedFalse(id)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada"));

        if (inv.getStatus() != InvestmentStatus.IN_PROGRESS) {
            throw new UpdateException("La inversión no puede ser cancelada en el estado actual: " + inv.getStatus());
        }

        inv.setStatus(InvestmentStatus.CANCELLED);
        inv.setConfirmedAt(LocalDate.now());

        Investment updatedInvestment = investmentRepo.save(inv);

        // ⚡ Auto-cancelar contrato si inversión cancelada
        autoCancelContractIfNeeded(updatedInvestment);

        return mapper.toResponse(updatedInvestment);
    }

    @Override
    public ResponseInvestmentDTO getById(Long id) {
        return investmentRepo.findByIdInvestmentAndDeletedFalse(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada"));
    }

    @Override
    public List<ResponseInvestmentDTO> getAll() {
        return investmentRepo.findByDeletedFalse()
                .stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseInvestmentDTO> getActiveForStudents() {
        List<InvestmentStatus> allowedStatuses = List.of(
                InvestmentStatus.IN_PROGRESS,
                InvestmentStatus.RECEIVED,
                InvestmentStatus.NOT_RECEIVED
        );
        return investmentRepo.findByDeletedFalseAndStatusIn(allowedStatuses)
                .stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseInvestmentDTO> getActiveByProjectForStudents(Long projectId) {
        List<InvestmentStatus> allowedStatuses = List.of(
                InvestmentStatus.IN_PROGRESS,
                InvestmentStatus.RECEIVED,
                InvestmentStatus.NOT_RECEIVED
        );
        return investmentRepo.findByProject_IdProjectAndDeletedFalseAndStatusIn(projectId, allowedStatuses)
                .stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ResponseInvestmentDTO delete(Long id) {
        Investment inv = investmentRepo.findByIdInvestmentAndDeletedFalse(id)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada"));

        inv.setDeleted(true);
        inv.setDeletedAt(LocalDate.now());

        return mapper.toResponse(investmentRepo.save(inv));
    }

    @Override
    public ResponseInvestmentDTO returnInvestment(Long investmentId) {
        Investment inv = investmentRepo.findByIdInvestmentAndDeletedFalse(investmentId)
                .orElseThrow(() -> new InvestmentNotFoundException("Inversión no encontrada"));

        if (inv.getStatus() != InvestmentStatus.RECEIVED) {
            throw new UpdateException("Solo inversiones RECEIVED pueden ser devueltas al inversor");
        }

        inv.setStatus(InvestmentStatus.RETURNED);
        inv.setConfirmedAt(LocalDate.now());

        Project project = inv.getProject();
        BigDecimal amountInUSD = inv.getAmount();
        if (inv.getCurrency() != Currency.USD) {
            amountInUSD = currencyConversionService
                    .getConversionRate(inv.getCurrency().name(), "USD")
                    .getRate()
                    .multiply(inv.getAmount());
        }

        BigDecimal newCurrentGoal = project.getCurrentGoal().subtract(amountInUSD);
        if (newCurrentGoal.compareTo(BigDecimal.ZERO) < 0) {
            newCurrentGoal = BigDecimal.ZERO;
        }

        project.setCurrentGoal(newCurrentGoal);
        projectRepo.save(project);

        return mapper.toResponse(investmentRepo.save(inv));
    }

    // -------------------
    // 🔹 Método interno para auto-cancelar contrato
    // -------------------
    private void autoCancelContractIfNeeded(Investment inv) {
        if (inv.getContract() != null &&
                (inv.getStatus() == InvestmentStatus.NOT_RECEIVED || inv.getStatus() == InvestmentStatus.CANCELLED)) {

            Contract contract = inv.getContract();

            if (contract.getStatus() == ContractStatus.SIGNED) {
                contract.setStatus(ContractStatus.CANCELLED);

                ContractAction action = ContractAction.builder()
                        .contract(contract)
                        .student(inv.getConfirmedBy()) // puede ser null si no hubo estudiante
                        .status(ContractStatus.CANCELLED)
                        .actionDate(LocalDate.now())
                        .build();

                contract.getActions().add(action);
                contractService.saveContract(contract);
            }
        }
    }
}
