package com.example.gestor_inversores.service.contract;

import com.example.gestor_inversores.dto.*;
import com.example.gestor_inversores.exception.*;
import com.example.gestor_inversores.mapper.ContractActionMapper;
import com.example.gestor_inversores.mapper.ContractMapper;
import com.example.gestor_inversores.model.*;
import com.example.gestor_inversores.model.enums.ContractStatus;
import com.example.gestor_inversores.model.enums.InvestmentStatus;
import com.example.gestor_inversores.repository.*;
import com.example.gestor_inversores.service.investment.InvestmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContractService implements IContractService {

    private final IContractRepository contractRepository;
    private final IProjectRepository projectRepository;
    private final IInvestorRepository investorRepository;
    private final IStudentRepository studentRepository;
    private final ContractMapper contractMapper;
    private final ContractActionMapper actionMapper;
    private final IInvestmentRepository investmentRepo;
    private final InvestmentService investmentService; // ✅ para usar returnInvestment()

    @Override
    public ResponseContractDTO createContract(RequestContractDTO dto) {
        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new ProjectNotFoundException("Proyecto no encontrado"));

        Investor investor = investorRepository.findById(dto.getCreatedByInvestorId())
                .orElseThrow(() -> new InvestorNotFoundException("Inversor no encontrado"));

        Contract contract = Contract.builder()
                .project(project)
                .createdByInvestor(investor)
                .amount(dto.getAmount())
                .currency(dto.getCurrency())
                .status(ContractStatus.PENDING_STUDENT_SIGNATURE) // estado inicial
                .createdAt(LocalDate.now())
                .profit1Year(dto.getProfit1Year())
                .profit2Years(dto.getProfit2Years())
                .profit3Years(dto.getProfit3Years())
                .actions(new ArrayList<>()) // lista vacía
                .build();

        contractRepository.save(contract);
        return contractMapper.toResponseDTO(contract);
    }

    @Override
    public ResponseContractDTO signContract(Long contractId, RequestContractActionByStudentDTO dto) {
        return handleStudentAction(contractId, dto, ContractStatus.SIGNED);
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
        return handleStudentAction(contractId, dto, ContractStatus.REFUNDED);
    }

    private ResponseContractDTO handleStudentAction(Long contractId, RequestContractActionByStudentDTO dto, ContractStatus actionStatus) {
        // 1️⃣ Buscar contrato
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contrato no encontrado"));

        // 2️⃣ Buscar estudiante
        Student student = studentRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new StudentNotFoundException("Estudiante no encontrado"));

        // 3️⃣ Validaciones según acción
        switch (actionStatus) {
            case SIGNED -> {
                if (contract.getStatus() != ContractStatus.PENDING_STUDENT_SIGNATURE) {
                    throw new ContractCannotBeModifiedException(
                            "Este contrato ya fue firmado, cancelado, cerrado o devuelto y no puede firmarse nuevamente.");
                }
            }
            case CLOSED -> {
                if (contract.getStatus() != ContractStatus.SIGNED) {
                    throw new ContractCannotBeModifiedException("Solo contratos firmados pueden cerrarse.");
                }
            }
            case CANCELLED -> {
                if (contract.getStatus() == ContractStatus.CANCELLED ||
                        contract.getStatus() == ContractStatus.CLOSED ||
                        contract.getStatus() == ContractStatus.REFUNDED) {
                    throw new ContractCannotBeModifiedException("El contrato no puede cancelarse en su estado actual.");
                }
            }
            case REFUNDED -> {
                if (contract.getStatus() != ContractStatus.SIGNED &&
                        contract.getStatus() != ContractStatus.CLOSED) {
                    throw new ContractCannotBeModifiedException("Solo contratos firmados o cerrados pueden devolverse al inversor.");
                }
            }
            default -> {}
        }

        // 4️⃣ Actualizar estado del contrato
        contract.setStatus(actionStatus);

        // 5️⃣ Crear y agregar ContractAction
        ContractAction action = ContractAction.builder()
                .contract(contract)
                .student(student)
                .status(actionStatus)
                .actionDate(LocalDate.now())
                .build();
        contract.getActions().add(action);

        // 6️⃣ Gestionar inversión
        Investment inv = contract.getInvestment();

        if (actionStatus == ContractStatus.SIGNED && inv == null) {
            // Crear inversión al firmar contrato
            inv = new Investment();
            inv.setAmount(contract.getAmount());
            inv.setCurrency(contract.getCurrency());
            inv.setGeneratedBy(contract.getCreatedByInvestor());
            inv.setProject(contract.getProject());
            inv.setStatus(InvestmentStatus.IN_PROGRESS);
            inv.setCreatedAt(LocalDate.now());
            inv.setContract(contract);
            investmentRepo.save(inv);
            contract.setInvestment(inv);
        }

        if (inv != null) {
            switch (actionStatus) {
                case CANCELLED -> {
                    // Cancelación sin devolución (nunca llegó a RECEIVED)
                    inv.setStatus(InvestmentStatus.CANCELLED);
                    investmentRepo.save(inv);
                }
                case REFUNDED -> {
                    // Devolución al inversor
                    investmentService.returnInvestment(inv.getIdInvestment());
                }
                case CLOSED -> {
                    // Contrato exitoso → la inversión queda en RECEIVED
                    // (liquidación de ganancias se maneja aparte)
                }
                case SIGNED -> {
                    // ⚡ Auto-cancelar si pasan 30 días y la inversión sigue IN_PROGRESS
                    if (inv.getStatus() == InvestmentStatus.IN_PROGRESS) {
                        LocalDate fechaLimite = inv.getCreatedAt().plusDays(30);
                        if (LocalDate.now().isAfter(fechaLimite)) {
                            inv.setStatus(InvestmentStatus.CANCELLED);
                            investmentRepo.save(inv);

                            contract.setStatus(ContractStatus.CANCELLED);
                        }
                    }
                }
                default -> {}
            }
        }

        // 7️⃣ Guardar contrato actualizado (ContractAction también se guarda en cascada)
        contractRepository.save(contract);

        // 8️⃣ Retornar DTO
        return contractMapper.toResponseDTO(contract);
    }

    @Override
    public ResponseContractDTO updateContractByInvestor(Long contractId, RequestContractUpdateByInvestorDTO dto) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contrato no encontrado"));

        if (contract.getStatus() != ContractStatus.PENDING_STUDENT_SIGNATURE)
            throw new ContractCannotBeModifiedException("Solo contratos pendientes pueden modificarse.");

        contractMapper.updateContractByInvestor(dto, contract);
        contractRepository.save(contract);
        return contractMapper.toResponseDTO(contract);
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

    // 🔹 Método para guardar contrato desde otros servicios
    public void saveContract(Contract contract) {
        contractRepository.save(contract);
    }

}
