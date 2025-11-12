package com.example.gestor_inversores.service.earning;

import com.example.gestor_inversores.dto.EarningsSummaryDTO;
import com.example.gestor_inversores.dto.ResponseEarningDTO;
import com.example.gestor_inversores.exception.*;
import com.example.gestor_inversores.mapper.EarningMapper;
import com.example.gestor_inversores.model.*;
import com.example.gestor_inversores.model.enums.EarningStatus;
import com.example.gestor_inversores.repository.IContractRepository;
import com.example.gestor_inversores.repository.IEarningRepository;
import com.example.gestor_inversores.repository.IInvestorRepository;
import com.example.gestor_inversores.repository.IProjectRepository;
import com.example.gestor_inversores.repository.IStudentRepository;
import com.example.gestor_inversores.service.mail.MailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EarningService implements IEarningService {

    private final IEarningRepository earningRepository;
    private final IContractRepository contractRepository; // Inyectado para validación
    private final EarningMapper earningMapper;
    private final IProjectRepository projectRepository;
    private final IStudentRepository studentRepository;
    private final IInvestorRepository investorRepository;
    private final MailService mailService;

    private static final int MAX_RETRIES = 3;

    @Override
    public ResponseEarningDTO createFromContract(Contract contract, Student generatedByStudent) {
        if (contract == null) throw new IllegalArgumentException("Contract cannot be null");
        Project project = contract.getProject();
        if (project == null) throw new IllegalStateException("Contract has no project");

        // Determinar duración del proyecto en años
        LocalDate start = project.getStartDate();
        LocalDate end = project.getEndDate() != null ? project.getEndDate() : project.getEstimatedEndDate();
        if (start == null || end == null) {
            start = contract.getCreatedAt();
            end = LocalDate.now();
        }
        long days = ChronoUnit.DAYS.between(start, end);
        double years = days / 365.0;

        // Seleccionar profitRate según duración
        BigDecimal profitRate = contract.getProfit1Year() != null ? contract.getProfit1Year() : BigDecimal.ZERO;
        if (years <= 1.0) profitRate = contract.getProfit1Year();
        else if (years <= 2.0) profitRate = contract.getProfit2Years();
        else profitRate = contract.getProfit3Years();

        if (profitRate == null) profitRate = BigDecimal.ZERO;

        // 🔹 Convertir porcentaje a fracción si es mayor a 1
        if (profitRate.compareTo(BigDecimal.ONE) > 0) {
            profitRate = profitRate.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        }

        // 🔹 Limitar a 4 decimales
        profitRate = profitRate.setScale(4, RoundingMode.HALF_UP);

        BigDecimal baseAmount = contract.getAmount();
        BigDecimal profitAmount = baseAmount.multiply(profitRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = baseAmount.add(profitAmount);

        Earning e = new Earning();
        e.setAmount(totalAmount);
        e.setBaseAmount(baseAmount);
        e.setProfitRate(profitRate);
        e.setProfitAmount(profitAmount);
        e.setCurrency(contract.getCurrency());
        e.setStatus(EarningStatus.IN_PROGRESS);
        e.setCreatedAt(LocalDate.now());
        e.setProject(project);
        e.setGeneratedBy(generatedByStudent);
        e.setContract(contract);

        Earning savedEarning = earningRepository.save(e);

        // Notificación al inversor - Ajustada para el nuevo flujo
        Investor investor = contract.getCreatedByInvestor();
        String toInvestor = investor.getEmail();
        String subject = String.format("¡El ciclo del proyecto '%s' ha finalizado!", project.getName());
        String body = String.format(
            "Hola %s,\n\n¡Buenas noticias! El proyecto '%s' en el que invertiste ha finalizado y se han calculado tus ganancias.\n\n" +
            "Aquí tienes el desglose de tu retorno:\n" +
            "------------------------------------\n" +
            "Inversión Original:   %.2f %s\n" +
            "Tasa de Ganancia:     %.2f%%\n" +
            "Monto de la Ganancia: %.2f %s\n" +
            "------------------------------------\n" +
            "**Monto Total a Recibir: %.2f %s**\n\n" +
            "El estudiante %s %s, responsable del proyecto, iniciará el proceso de pago de esta ganancia. Por favor, mantente atento a una nueva notificación de su parte para confirmar el envío de los fondos.\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            investor.getUsername(),
            project.getName(),
            savedEarning.getBaseAmount(),
            savedEarning.getCurrency(),
            savedEarning.getProfitRate().multiply(BigDecimal.valueOf(100)),
            savedEarning.getProfitAmount(),
            savedEarning.getCurrency(),
            savedEarning.getAmount(),
            savedEarning.getCurrency(),
            project.getOwner().getFirstName(),
            project.getOwner().getLastName()
        );
        mailService.sendEmail(toInvestor, subject, body);

        return earningMapper.toResponse(savedEarning);
    }

    @Override
    public ResponseEarningDTO confirmPaymentSent(Long earningId, Long studentId) {
        Earning earning = earningRepository.findById(earningId)
                .orElseThrow(() -> new EarningNotFoundException("Ganancia no encontrada"));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException("Estudiante no encontrado"));

        if (!earning.getGeneratedBy().getId().equals(student.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para confirmar el envío de esta ganancia. Solo el estudiante dueño del proyecto puede hacerlo.");
        }

        if (earning.getStatus() != EarningStatus.IN_PROGRESS && earning.getStatus() != EarningStatus.NOT_RECEIVED) {
            throw new UpdateException("La ganancia solo se puede marcar como enviada si su estado es 'IN_PROGRESS' o 'NOT_RECEIVED'. Estado actual: " + earning.getStatus());
        }

        if (earning.getRetryCount() >= MAX_RETRIES) {
            throw new BusinessException("Se ha alcanzado el número máximo de reintentos para el envío de esta ganancia. Por favor, contacta a soporte.");
        }

        if (earning.getStatus() == EarningStatus.NOT_RECEIVED) {
            earning.setRetryCount(earning.getRetryCount() + 1);
        }

        earning.setStatus(EarningStatus.PENDING_CONFIRMATION);
        earning.setConfirmedAt(LocalDate.now());

        Earning savedEarning = earningRepository.save(earning);

        Investor investor = savedEarning.getContract().getCreatedByInvestor();
        String toInvestor = investor.getEmail();
        String subject = String.format("¡Pago de ganancia enviado para tu proyecto '%s'!", savedEarning.getProject().getName());
        String body = String.format(
            "Hola %s,\n\nEl estudiante %s %s ha confirmado que ha enviado el pago de la ganancia de %.2f %s para el proyecto '%s'.\n\n" +
            "Por favor, verifica la recepción de los fondos en tu cuenta y confirma la ganancia en la plataforma.\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            investor.getUsername(),
            student.getFirstName(),
            student.getLastName(),
            savedEarning.getAmount(),
            savedEarning.getCurrency(),
            savedEarning.getProject().getName()
        );
        mailService.sendEmail(toInvestor, subject, body);

        return earningMapper.toResponse(savedEarning);
    }

    @Override
    public ResponseEarningDTO confirmReceipt(Long earningId, Long investorId) {
        Earning earning = earningRepository.findById(earningId)
                .orElseThrow(() -> new EarningNotFoundException("Ganancia no encontrada"));

        Investor investor = investorRepository.findById(investorId)
                .orElseThrow(() -> new InvestorNotFoundException("Inversor no encontrado"));

        Long earningOwnerId = earning.getContract().getCreatedByInvestor().getId();
        if (!earningOwnerId.equals(investor.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para gestionar esta ganancia.");
        }

        if (earning.getStatus() != EarningStatus.PENDING_CONFIRMATION && earning.getStatus() != EarningStatus.NOT_RECEIVED) {
            throw new UpdateException("La ganancia solo se puede confirmar si su estado es 'PENDING_CONFIRMATION' o 'NOT_RECEIVED'. Estado actual: " + earning.getStatus());
        }

        earning.setStatus(EarningStatus.RECEIVED);
        earning.setConfirmedBy(investor);
        earning.setConfirmedAt(LocalDate.now());

        Earning savedEarning = earningRepository.save(earning);

        String toStudent = savedEarning.getProject().getOwner().getEmail();
        String subject = String.format("¡Pago de ganancia confirmado para tu proyecto '%s'!", savedEarning.getProject().getName());
        String body = String.format(
            "Hola %s,\n\nEl inversor '%s' ha confirmado la recepción del pago de la ganancia de %.2f %s para el proyecto '%s'.\n\n" +
            "¡Felicidades por completar el ciclo de inversión!\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            savedEarning.getProject().getOwner().getFirstName(),
            investor.getUsername(),
            savedEarning.getAmount(),
            savedEarning.getCurrency(),
            savedEarning.getProject().getName()
        );
        mailService.sendEmail(toStudent, subject, body);

        return earningMapper.toResponse(savedEarning);
    }

    @Override
    public ResponseEarningDTO markAsNotReceived(Long earningId, Long investorId) {
        Earning earning = earningRepository.findById(earningId)
                .orElseThrow(() -> new EarningNotFoundException("Ganancia no encontrada"));

        Investor investor = investorRepository.findById(investorId)
                .orElseThrow(() -> new InvestorNotFoundException("Inversor no encontrado"));

        Long earningOwnerId = earning.getContract().getCreatedByInvestor().getId();
        if (!earningOwnerId.equals(investor.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para gestionar esta ganancia.");
        }

        if (earning.getStatus() != EarningStatus.PENDING_CONFIRMATION) {
            throw new UpdateException("Esta ganancia no puede ser marcada como 'no recibida' en su estado actual. Se espera el estado 'PENDING_CONFIRMATION'. Estado actual: " + earning.getStatus());
        }

        earning.setStatus(EarningStatus.NOT_RECEIVED);
        earning.setConfirmedBy(investor);
        earning.setConfirmedAt(LocalDate.now());

        Project project = earning.getProject();
        if (project.getOwner() != null && project.getOwner().getEmail() != null && !project.getOwner().getEmail().isBlank()) {
            String subject = "Alerta: Ganancia no recibida";
            String body = "El inversor " + investor.getUsername() +
                    " reportó que no recibió la ganancia del contrato " + earning.getContract().getIdContract() +
                    " del proyecto " + project.getName() + ". Por favor, comuníquese con el inversor para resolverlo.";
            mailService.sendEmail(project.getOwner().getEmail(), subject, body);
        }

        return earningMapper.toResponse(earningRepository.save(earning));
    }

    @Override
    public List<ResponseEarningDTO> getByProject(Long projectId) {
        return earningRepository.findByProject_IdProject(projectId)
                .stream()
                .map(earningMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseEarningDTO> getByInvestor(Long investorId, EarningStatus status) {
        if (!investorRepository.existsById(investorId)) {
            throw new InvestorNotFoundException("Inversor no encontrado con ID: " + investorId);
        }

        List<Earning> earnings;
        if (status == null) {
            earnings = earningRepository.findByContract_CreatedByInvestor_Id(investorId);
        } else {
            earnings = earningRepository.findByContract_CreatedByInvestor_IdAndStatus(investorId, status);
        }

        return earnings.stream()
                .map(earningMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseEarningDTO> getByStudent(Long studentId) {
        return earningRepository.findByGeneratedBy_Id(studentId)
                .stream()
                .map(earningMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseEarningDTO> getAll() {
        return earningRepository.findAll()
                .stream()
                .map(earningMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public EarningsSummaryDTO getEarningsSummary() {
        List<Earning> allEarnings = earningRepository.findAll();

        BigDecimal totalEarnings = allEarnings.stream()
                .map(Earning::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalBaseAmount = allEarnings.stream()
                .map(Earning::getBaseAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalProfitAmount = allEarnings.stream()
                .map(Earning::getProfitAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalCount = allEarnings.size();

        Map<String, BigDecimal> totalEarningsByCurrency = allEarnings.stream()
                .collect(Collectors.groupingBy(e -> e.getCurrency().name(),
                        Collectors.reducing(BigDecimal.ZERO, Earning::getAmount, BigDecimal::add)));

        return new EarningsSummaryDTO(totalEarnings, totalBaseAmount, totalProfitAmount, totalCount, totalEarningsByCurrency);
    }

    @Override
    public List<ResponseEarningDTO> getByProjectId(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ProjectNotFoundException("Proyecto no encontrado con ID: " + projectId);
        }
        List<Earning> earnings = earningRepository.findByProject_IdProject(projectId);
        return earnings.stream()
                .map(earningMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseEarningDTO> getByContractId(Long contractId) {
        if (!contractRepository.existsById(contractId)) {
            throw new ContractNotFoundException("Contrato no encontrado con ID: " + contractId);
        }
        List<Earning> earnings = earningRepository.findByContract_IdContract(contractId);
        return earnings.stream()
                .map(earningMapper::toResponse)
                .collect(Collectors.toList());
    }
}
