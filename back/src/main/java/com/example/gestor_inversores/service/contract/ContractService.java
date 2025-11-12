package com.example.gestor_inversores.service.contract;

import com.example.gestor_inversores.dto.*;
import com.example.gestor_inversores.exception.*;
import com.example.gestor_inversores.mapper.ContractMapper;
import com.example.gestor_inversores.model.*;
import com.example.gestor_inversores.model.enums.ContractStatus;
import com.example.gestor_inversores.model.enums.Currency;
import com.example.gestor_inversores.model.enums.InvestmentStatus;
import com.example.gestor_inversores.model.enums.ProjectStatus;
import com.example.gestor_inversores.repository.*;
import com.example.gestor_inversores.service.currency.CurrencyConversionService;
import com.example.gestor_inversores.service.earning.EarningService;
import com.example.gestor_inversores.service.investment.InvestmentService;
import com.example.gestor_inversores.service.mail.IMailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class ContractService implements IContractService {

    private final IContractRepository contractRepository;
    private final IProjectRepository projectRepository;
    private final IInvestorRepository investorRepository;
    private final IStudentRepository studentRepository;
    private final ContractMapper contractMapper;
    private final IInvestmentRepository investmentRepo;
    private final InvestmentService investmentService;
    private final EarningService earningService;
    private final IMailService mailService;
    private final CurrencyConversionService currencyConversionService;

    @Autowired
    public ContractService(IContractRepository contractRepository, IProjectRepository projectRepository, IInvestorRepository investorRepository, IStudentRepository studentRepository, ContractMapper contractMapper, IInvestmentRepository investmentRepo, @Lazy InvestmentService investmentService, EarningService earningService, IMailService mailService, CurrencyConversionService currencyConversionService) {
        this.contractRepository = contractRepository;
        this.projectRepository = projectRepository;
        this.investorRepository = investorRepository;
        this.studentRepository = studentRepository;
        this.contractMapper = contractMapper;
        this.investmentRepo = investmentRepo;
        this.investmentService = investmentService;
        this.earningService = earningService;
        this.mailService = mailService;
        this.currencyConversionService = currencyConversionService;
    }

    @Override
    public ResponseContractDTO createContract(RequestContractDTO dto) {
        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new ProjectNotFoundException("Proyecto no encontrado"));

        Investor investor = investorRepository.findById(dto.getCreatedByInvestorId())
                .orElseThrow(() -> new InvestorNotFoundException("Inversor no encontrado"));

        if (dto.getTextTitle() != null && !dto.getTextTitle().isEmpty()) {
            contractRepository.findByCreatedByInvestorIdAndTextTitleIgnoreCase(dto.getCreatedByInvestorId(), dto.getTextTitle())
                .ifPresent(existingContract -> {
                    throw new BusinessException("Ya tienes un contrato con el título '" + dto.getTextTitle() + "'. Por favor, elige un título diferente.");
                });
        }

        if (project.getStatus() != ProjectStatus.PENDING_FUNDING) {
            throw new BusinessException("Este proyecto ya no acepta nuevas ofertas de inversión porque ya está financiado o completado.");
        }

        // Se elimina la validación estricta aquí para permitir ofertas que puedan sobrefinanciar.
        // validateOfferAmount(project, dto.getAmount(), dto.getCurrency());

        BigDecimal profit1 = dto.getProfit1Year() != null && dto.getProfit1Year().compareTo(BigDecimal.ONE) > 0 ? dto.getProfit1Year().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP) : dto.getProfit1Year();
        BigDecimal profit2 = dto.getProfit2Years() != null && dto.getProfit2Years().compareTo(BigDecimal.ONE) > 0 ? dto.getProfit2Years().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP) : dto.getProfit2Years();
        BigDecimal profit3 = dto.getProfit3Years() != null && dto.getProfit3Years().compareTo(BigDecimal.ONE) > 0 ? dto.getProfit3Years().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP) : dto.getProfit3Years();

        Contract contract = Contract.builder()
                .project(project)
                .createdByInvestor(investor)
                .textTitle(dto.getTextTitle())
                .description(dto.getDescription())
                .amount(dto.getAmount())
                .currency(dto.getCurrency())
                .status(ContractStatus.DRAFT)
                .createdAt(LocalDate.now())
                .profit1Year(profit1)
                .profit2Years(profit2)
                .profit3Years(profit3)
                .actions(new ArrayList<>())
                .build();

        Contract savedContract = contractRepository.save(contract);

        String toStudent = project.getOwner().getEmail();
        String subjectToStudent = String.format("¡Nueva propuesta de contrato para tu proyecto '%s'!", project.getName());
        String bodyToStudent = String.format(
            "Hola %s,\n\nEl inversor '%s' ha creado una propuesta de contrato para tu proyecto '%s'.\n\n" +
            "Puedes revisar y editar los detalles del contrato desde la plataforma. Una vez que ambos estéis de acuerdo con los términos, podréis pasar a la fase de firma.\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            project.getOwner().getFirstName(),
            investor.getUsername(),
            project.getName()
        );
        mailService.sendEmail(toStudent, subjectToStudent, bodyToStudent);

        return contractMapper.toResponseDTO(savedContract);
    }

    @Override
    public ResponseContractDTO updateContractByInvestor(Long contractId, RequestContractUpdateByInvestorDTO dto) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contrato no encontrado"));

        if (!contract.getCreatedByInvestor().getId().equals(dto.getInvestorId())) {
            throw new UnauthorizedOperationException("No tienes permiso para modificar este contrato.");
        }

        if (contract.getStatus() != ContractStatus.DRAFT)
            throw new ContractCannotBeModifiedException("Solo se pueden modificar contratos en estado de borrador (DRAFT).");

        if (dto.getAmount() != null) {
            // Se elimina la validación estricta para permitir la sobrefinanciación.
            // validateOfferAmount(contract.getProject(), dto.getAmount(), dto.getCurrency() != null ? dto.getCurrency() : contract.getCurrency());
        }

        if (dto.getTextTitle() != null && !dto.getTextTitle().equalsIgnoreCase(contract.getTextTitle())) {
            contractRepository.findByCreatedByInvestorIdAndTextTitleIgnoreCase(dto.getInvestorId(), dto.getTextTitle())
                .ifPresent(existingContract -> {
                    if (!existingContract.getIdContract().equals(contractId)) {
                        throw new BusinessException("Ya tienes otro contrato con el título '" + dto.getTextTitle() + "'. Por favor, elige un título diferente.");
                    }
                });
        }

        if (dto.getProfit1Year() != null && dto.getProfit1Year().compareTo(BigDecimal.ONE) > 0) {
            dto.setProfit1Year(dto.getProfit1Year().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        }
        if (dto.getProfit2Years() != null && dto.getProfit2Years().compareTo(BigDecimal.ONE) > 0) {
            dto.setProfit2Years(dto.getProfit2Years().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        }
        if (dto.getProfit3Years() != null && dto.getProfit3Years().compareTo(BigDecimal.ONE) > 0) {
            dto.setProfit3Years(dto.getProfit3Years().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        }

        contractMapper.updateContractByInvestor(dto, contract);
        Contract savedContract = contractRepository.save(contract);

        Student student = savedContract.getProject().getOwner();
        String toStudent = student.getEmail();
        String subject = String.format("El contrato para '%s' ha sido actualizado", savedContract.getProject().getName());
        String body = String.format(
            "Hola %s,\n\nEl inversor '%s' ha realizado cambios en la propuesta de contrato para tu proyecto '%s'.\n\n" +
            "Por favor, revisa los nuevos términos en la plataforma.\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            student.getFirstName(),
            savedContract.getCreatedByInvestor().getUsername(),
            savedContract.getProject().getName()
        );
        mailService.sendEmail(toStudent, subject, body);

        return contractMapper.toResponseDTO(savedContract);
    }

    @Override
    public ResponseContractDTO updateContractByStudent(Long contractId, RequestContractUpdateByStudentDTO dto) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contrato no encontrado"));

        Student student = studentRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new StudentNotFoundException("Estudiante no encontrado"));

        if (!contract.getProject().getOwner().getId().equals(student.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para modificar este contrato. Solo el dueño del proyecto puede hacerlo.");
        }

        if (contract.getStatus() != ContractStatus.DRAFT) {
            throw new ContractCannotBeModifiedException("Solo se pueden modificar contratos en estado de borrador (DRAFT).");
        }

        if (dto.getProfit1Year() != null && dto.getProfit1Year().compareTo(BigDecimal.ONE) > 0) {
            dto.setProfit1Year(dto.getProfit1Year().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        }
        if (dto.getProfit2Years() != null && dto.getProfit2Years().compareTo(BigDecimal.ONE) > 0) {
            dto.setProfit2Years(dto.getProfit2Years().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        }
        if (dto.getProfit3Years() != null && dto.getProfit3Years().compareTo(BigDecimal.ONE) > 0) {
            dto.setProfit3Years(dto.getProfit3Years().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        }

        contractMapper.updateContractByStudent(dto, contract);
        Contract savedContract = contractRepository.save(contract);

        Investor investor = savedContract.getCreatedByInvestor();
        String toInvestor = investor.getEmail();
        String subject = String.format("El contrato para '%s' ha sido actualizado por el estudiante", savedContract.getProject().getName());
        String body = String.format(
            "Hola %s,\n\nEl estudiante '%s %s' ha realizado cambios en la propuesta de contrato para tu proyecto '%s'.\n\n" +
            "Por favor, revisa los nuevos términos en la plataforma.\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            investor.getUsername(),
            student.getFirstName(),
            student.getLastName(),
            savedContract.getProject().getName()
        );
        mailService.sendEmail(toInvestor, subject, body);

        return contractMapper.toResponseDTO(savedContract);
    }

    @Override
    public ResponseContractDTO agreeByStudent(Long contractId, RequestContractActionByStudentDTO dto) {
        Contract contract = contractRepository.findById(contractId)
            .orElseThrow(() -> new ContractNotFoundException("Contrato no encontrado"));
        Student student = studentRepository.findById(dto.getStudentId())
            .orElseThrow(() -> new StudentNotFoundException("Estudiante no encontrado"));

        if (!contract.getProject().getOwner().getId().equals(student.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para realizar esta acción. Solo el dueño del proyecto puede hacerlo.");
        }

        return agreeAndLockContract(contract, student.getFirstName() + " " + student.getLastName(), contract.getCreatedByInvestor().getEmail());
    }

    @Override
    public ResponseContractDTO agreeByInvestor(Long contractId, RequestContractActionByInvestorDTO dto) {
        Contract contract = contractRepository.findById(contractId)
            .orElseThrow(() -> new ContractNotFoundException("Contrato no encontrado"));
        Investor investor = investorRepository.findById(dto.getInvestorId())
            .orElseThrow(() -> new InvestorNotFoundException("Inversor no encontrado"));

        if (!contract.getCreatedByInvestor().getId().equals(investor.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para realizar esta acción. Solo el creador del contrato puede hacerlo.");
        }

        return agreeAndLockContract(contract, investor.getUsername(), contract.getProject().getOwner().getEmail());
    }

    private ResponseContractDTO agreeAndLockContract(Contract contract, String actorName, String notificationEmail) {
        if (contract.getStatus() != ContractStatus.DRAFT) {
            throw new ContractCannotBeModifiedException("El contrato ya no está en fase de borrador. No se puede volver a acordar.");
        }

        contract.setStatus(ContractStatus.PARTIALLY_SIGNED);

        ContractAction action = ContractAction.builder()
                .contract(contract)
                .student(contract.getProject().getOwner()) 
                .status(ContractStatus.PARTIALLY_SIGNED)
                .actionDate(LocalDate.now())
                .build();
        contract.getActions().add(action);

        Contract savedContract = contractRepository.save(contract);

        String subject = String.format("Acuerdo alcanzado para el contrato del proyecto '%s'", contract.getProject().getName());
        String body = String.format(
            "Hola,\n\nSe ha alcanzado un acuerdo sobre los términos del contrato para el proyecto '%s'.\n\n" +
            "La propuesta ha sido aceptada por %s y el contrato ha sido bloqueado para su edición.\n\n" +
            "El siguiente paso es que ambas partes firmen el contrato para formalizar la inversión.\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            contract.getProject().getName(),
            actorName
        );
        mailService.sendEmail(notificationEmail, subject, body);

        return contractMapper.toResponseDTO(savedContract);
    }

    @Override
    public ResponseContractDTO signByStudent(Long contractId, RequestContractActionByStudentDTO dto) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contrato no encontrado"));
        Student student = studentRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new StudentNotFoundException("Estudiante no encontrado"));

        if (!contract.getProject().getOwner().getId().equals(student.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para firmar este contrato. Solo el dueño del proyecto puede hacerlo.");
        }

        if (contract.getStatus() != ContractStatus.PARTIALLY_SIGNED) {
            throw new ContractCannotBeModifiedException("Este contrato no puede ser firmado en su estado actual.");
        }

        if (contract.isStudentSigned()) {
            throw new BusinessException("Ya has firmado este contrato.");
        }

        contract.setStudentSigned(true);
        contract.setStudentSignedDate(LocalDate.now());

        if (contract.isInvestorSigned()) {
            return finalizeContract(contract);
        } else {
            contractRepository.save(contract);
            String toInvestor = contract.getCreatedByInvestor().getEmail();
            String subject = String.format("El estudiante ha firmado el contrato para '%s'", contract.getProject().getName());
            String body = String.format(
                "Hola %s,\n\nEl estudiante %s %s ha firmado el contrato para el proyecto '%s'.\n\n" +
                "Ahora solo falta tu firma para activar la inversión.\n\n" +
                "Saludos,\nEl equipo de ProyPlus",
                contract.getCreatedByInvestor().getUsername(),
                student.getFirstName(),
                student.getLastName(),
                contract.getProject().getName()
            );
            mailService.sendEmail(toInvestor, subject, body);
        }

        return contractMapper.toResponseDTO(contract);
    }

    @Override
    public ResponseContractDTO signByInvestor(Long contractId, RequestContractActionByInvestorDTO dto) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contrato no encontrado"));
        Investor investor = investorRepository.findById(dto.getInvestorId())
                .orElseThrow(() -> new InvestorNotFoundException("Inversor no encontrado"));

        if (!contract.getCreatedByInvestor().getId().equals(investor.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para firmar este contrato. Solo el creador del contrato puede hacerlo.");
        }

        if (contract.getStatus() != ContractStatus.PARTIALLY_SIGNED) {
            throw new ContractCannotBeModifiedException("Este contrato no puede ser firmado en su estado actual.");
        }

        if (contract.isInvestorSigned()) {
            throw new BusinessException("Ya has firmado este contrato.");
        }

        contract.setInvestorSigned(true);
        contract.setInvestorSignedDate(LocalDate.now());

        if (contract.isStudentSigned()) {
            return finalizeContract(contract);
        } else {
            contractRepository.save(contract);
            Student student = contract.getProject().getOwner();
            String toStudent = student.getEmail();
            String subject = String.format("El inversor ha firmado el contrato para '%s'", contract.getProject().getName());
            String body = String.format(
                "Hola %s,\n\nEl inversor %s ha firmado el contrato para tu proyecto '%s'.\n\n" +
                "Ahora solo falta tu firma para activar la inversión.\n\n" +
                "Saludos,\nEl equipo de ProyPlus",
                student.getFirstName(),
                investor.getUsername(),
                contract.getProject().getName()
            );
            mailService.sendEmail(toStudent, subject, body);
        }

        return contractMapper.toResponseDTO(contract);
    }

    private ResponseContractDTO finalizeContract(Contract contract) {
        if (contract.getProject().getStatus() != ProjectStatus.PENDING_FUNDING) {
            throw new BusinessException("No se puede firmar el contrato. El proyecto ya ha sido financiado.");
        }

        contract.setStatus(ContractStatus.SIGNED);

        ContractAction action = ContractAction.builder()
                .contract(contract)
                .student(contract.getProject().getOwner())
                .status(ContractStatus.SIGNED)
                .actionDate(LocalDate.now())
                .build();
        contract.getActions().add(action);

        Investment inv = new Investment();
        inv.setAmount(contract.getAmount());
        inv.setCurrency(contract.getCurrency());
        inv.setGeneratedBy(contract.getCreatedByInvestor());
        inv.setProject(contract.getProject());
        inv.setStatus(InvestmentStatus.IN_PROGRESS); // Revertido: El estado inicial es IN_PROGRESS según el enum
        inv.setCreatedAt(LocalDate.now());
        inv.setContract(contract);
        investmentRepo.save(inv);
        contract.setInvestment(inv);

        contractRepository.save(contract);

        String toInvestor = contract.getCreatedByInvestor().getEmail();
        String subjectToInvestor = String.format("¡Contrato para '%s' activado!", contract.getProject().getName());
        String bodyToInvestor = String.format(
            "Hola %s,\n\n¡Buenas noticias! Ambas partes han firmado el contrato para el proyecto '%s'.\n\n" +
            "La inversión ha sido creada y está esperando a que realices la transferencia.\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            contract.getCreatedByInvestor().getUsername(),
            contract.getProject().getName()
        );
        mailService.sendEmail(toInvestor, subjectToInvestor, bodyToInvestor);

        Student student = contract.getProject().getOwner();
        String toStudent = student.getEmail();
        String subjectToStudent = String.format("¡Contrato para '%s' activado!", contract.getProject().getName());
        String bodyToStudent = String.format(
            "Hola %s,\n\n¡Buenas noticias! Ambas partes han firmado el contrato para tu proyecto '%s'.\n\n" +
            "La inversión del inversor %s ha sido registrada y está pendiente de transferencia.\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            student.getFirstName(),
            contract.getCreatedByInvestor().getUsername(),
            contract.getProject().getName()
        );
        mailService.sendEmail(toStudent, subjectToStudent, bodyToStudent);

        return contractMapper.toResponseDTO(contract);
    }

    @Override
    public ResponseContractDTO closeContract(Long contractId, RequestContractActionByStudentDTO dto) {
        return handleStudentAction(contractId, dto, ContractStatus.CLOSED);
    }

    @Override
    public ResponseContractDTO cancelContract(Long contractId, RequestContractActionByStudentDTO dto) {
        return handleStudentAction(contractId, dto, ContractStatus.CANCELLED);
    }

    @Override
    public ResponseContractDTO refundContract(Long contractId, RequestContractActionByStudentDTO dto) {
        return handleStudentAction(contractId, dto, ContractStatus.PENDING_REFUND);
    }

    private ResponseContractDTO handleStudentAction(Long contractId, RequestContractActionByStudentDTO dto, ContractStatus actionStatus) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contrato no encontrado"));

        Student student = studentRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new StudentNotFoundException("Estudiante no encontrado"));

        if (!contract.getProject().getOwner().getId().equals(student.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para gestionar este contrato. Solo el dueño del proyecto puede hacerlo.");
        }

        switch (actionStatus) {
            case CLOSED -> {
                if (contract.getStatus() != ContractStatus.SIGNED) {
                    throw new ContractCannotBeModifiedException("Solo contratos firmados pueden cerrarse.");
                }
            }
            case CANCELLED -> {
                if (contract.getStatus() == ContractStatus.CLOSED ||
                        contract.getStatus() == ContractStatus.REFUNDED) {
                    throw new ContractCannotBeModifiedException("El contrato no puede cancelarse en su estado actual.");
                }
            }
            case PENDING_REFUND -> {
                if (contract.getStatus() != ContractStatus.SIGNED &&
                        contract.getStatus() != ContractStatus.CLOSED) {
                    throw new ContractCannotBeModifiedException("Solo contratos firmados o cerrados pueden devolverse al inversor.");
                }
                Project project = contract.getProject();
                if (project.getStatus() != ProjectStatus.CANCELLED &&
                    project.getStatus() != ProjectStatus.NOT_FUNDED) {
                    throw new BusinessException("Solo se pueden reembolsar contratos de proyectos cancelados o no financiados.");
                }
            }
            default -> throw new BusinessException("Acción no válida: " + actionStatus);
        }

        contract.setStatus(actionStatus);

        ContractAction action = ContractAction.builder()
                .contract(contract)
                .student(student)
                .status(actionStatus)
                .actionDate(LocalDate.now())
                .build();
        contract.getActions().add(action);

        Investment inv = contract.getInvestment();

        if (inv != null) {
            switch (actionStatus) {
                case CANCELLED -> {
                    inv.setStatus(InvestmentStatus.CANCELLED);
                    investmentRepo.save(inv);
                }
                case PENDING_REFUND -> {
                    inv.setStatus(InvestmentStatus.PENDING_REFUND);
                    investmentRepo.save(inv);
                }
                case CLOSED -> {
                    contractRepository.save(contract);
                    earningService.createFromContract(contract, student);

                    if (inv.getStatus() == InvestmentStatus.RECEIVED) { 
                        inv.setStatus(InvestmentStatus.COMPLETED);
                        investmentRepo.save(inv);
                    }
                }
                default -> {}
            }
        }

        contractRepository.save(contract);

        if (actionStatus == ContractStatus.CANCELLED) {
            String toInvestor = contract.getCreatedByInvestor().getEmail();
            String subject = String.format("Alerta: Contrato para el proyecto '%s' cancelado", contract.getProject().getName());
            String body = String.format(
                "Hola %s,\n\nTe informamos que el contrato para el proyecto '%s' ha sido cancelado por el estudiante %s %s.\n\n" +
                "Si no esperabas esta acción, te recomendamos ponerte en contacto con el estudiante para aclarar la situación.\n\n" +
                "Saludos,\nEl equipo de ProyPlus",
                contract.getCreatedByInvestor().getUsername(),
                contract.getProject().getName(),
                student.getFirstName(),
                student.getLastName()
            );
            mailService.sendEmail(toInvestor, subject, body);
        } else if (actionStatus == ContractStatus.PENDING_REFUND) {
            String toStudent = student.getEmail();
            String subject = String.format("Has iniciado la devolución para el proyecto '%s'", contract.getProject().getName());
            String body = String.format(
                "Hola %s,\n\nHas iniciado el proceso de devolución de la inversión de %.2f %s para el proyecto '%s'.\n\n" +
                "El estado del contrato ahora es 'PENDIENTE DE DEVOLUCIÓN'.\n\n" +
                "Acción Requerida: El siguiente paso es realizar la transferencia de los fondos al inversor. Una vez que lo hayas hecho, por favor, ingresa a la plataforma y confirma que has enviado la devolución para notificar al inversor.\n\n" +
                "Saludos,\nEl equipo de ProyPlus",
                student.getFirstName(),
                contract.getAmount(),
                contract.getCurrency(),
                contract.getProject().getName()
            );
            mailService.sendEmail(toStudent, subject, body);
        }

        return contractMapper.toResponseDTO(contract);
    }

    @Override
    public ResponseContractDTO cancelByInvestor(Long contractId, RequestContractActionByInvestorDTO dto) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contrato no encontrado"));
        Investor investor = investorRepository.findById(dto.getInvestorId())
                .orElseThrow(() -> new InvestorNotFoundException("Inversor no encontrado"));

        if (!contract.getCreatedByInvestor().getId().equals(investor.getId())) {
            throw new UnauthorizedOperationException("No tienes permiso para cancelar este contrato.");
        }

        if (contract.getStatus() != ContractStatus.DRAFT && contract.getStatus() != ContractStatus.PARTIALLY_SIGNED) {
            throw new ContractCannotBeModifiedException("Esta oferta de contrato ya no puede ser cancelada porque ya ha sido firmada o procesada.");
        }

        contract.setStatus(ContractStatus.CANCELLED);

        Contract savedContract = contractRepository.save(contract);

        Project project = savedContract.getProject();
        Student student = project.getOwner();

        String toStudent = student.getEmail();
        String subject = String.format("Una oferta para tu proyecto '%s' ha sido retirada", project.getName());
        String body = String.format(
            "Hola %s,\n\nTe informamos que el inversor '%s' ha retirado su oferta de contrato para tu proyecto '%s'.\n\n" +
            "Esta oferta ya no está disponible para ser firmada.\n\n" +
            "Saludos,\nEl equipo de ProyPlus",
            student.getFirstName(),
            investor.getUsername(),
            project.getName()
        );
        mailService.sendEmail(toStudent, subject, body);

        return contractMapper.toResponseDTO(savedContract);
    }

    @Override
    public List<ResponseContractDTO> getContractsByProject(Long projectId) {
        projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("No se encontró el proyecto"));

        return contractRepository.findByProject_IdProject(projectId)
                .stream()
                .map(contractMapper::toResponseDTO)
                .toList();
    }

    @Override
    public List<ResponseContractDTO> getContractsByInvestor(Long investorId) {
        investorRepository.findById(investorId)
                .orElseThrow(() -> new InvestorNotFoundException("No se encontró el inversor"));

        return contractRepository.findByCreatedByInvestorId(investorId)
                .stream()
                .map(contractMapper::toResponseDTO)
                .toList();
    }

    @Override
    public List<ResponseContractDTO> getContractsByOwner(Long ownerId) {
        studentRepository.findById(ownerId)
                .orElseThrow(() -> new StudentNotFoundException("Estudiante con id " + ownerId + " no encontrado."));

        if (!projectRepository.existsByOwnerId(ownerId)) {
            throw new UnauthorizedOperationException("El estudiante con id " + ownerId + " no es dueño de ningún proyecto.");
        }

        List<Contract> contracts = contractRepository.findByProjectOwnerId(ownerId);

        return contracts.stream()
                .map(contractMapper::toResponseDTO)
                .toList();
    }

    @Override
    public List<ResponseContractDTO> getContractsByInvestorAndProject(Long investorId, Long projectId) {
        List<Contract> contracts = contractRepository.findByCreatedByInvestorIdAndProject_IdProject(investorId, projectId)
                .orElseThrow(() -> new ContractNotFoundException("No contracts for that project were found for that investor."));
        return contracts.stream()
                .map(contractMapper::toResponseDTO)
                .toList();
    }

    @Override
    public Map<String, Boolean> checkContractExists(Long projectId, String contractName) {
        boolean exists = contractRepository.existsByProjectIdProjectAndTextTitleIgnoreCase(projectId, contractName);
        return Collections.singletonMap("exists", exists);
    }

    public void saveContract(Contract contract) {
        contractRepository.save(contract);
    }

    // El método validateOfferAmount ya no es necesario en este servicio, se puede eliminar o dejar comentado.
    /*
     private void validateOfferAmount(Project project, BigDecimal amount, Currency currency) {
         BigDecimal remainingBudget = project.getBudgetGoal().subtract(project.getCurrentGoal());
         BigDecimal offerAmountInUSD = amount;
 
         if (currency != Currency.USD) {
             if (currencyConversionService == null) {
                 throw new IllegalStateException("El servicio de conversión de moneda no está disponible.");
             }
             offerAmountInUSD = currencyConversionService.getConversionRate(currency.name(), "USD")
                     .getRate().multiply(amount);
         }
 
         if (offerAmountInUSD.compareTo(remainingBudget) > 0) {
             throw new BusinessException(String.format(
                     "El monto de la oferta (%.2f USD) supera el capital restante para financiar el proyecto (%.2f USD).",
                     offerAmountInUSD, remainingBudget));
         }
     }
    */
}
