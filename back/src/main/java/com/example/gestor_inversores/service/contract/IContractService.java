package com.example.gestor_inversores.service.contract;

import com.example.gestor_inversores.dto.*;
import java.util.List;
import java.util.Map;

public interface IContractService {

    // 🔹 Crear y modificar borradores
    ResponseContractDTO createContract(RequestContractDTO dto);
    ResponseContractDTO updateContractByInvestor(Long contractId, RequestContractUpdateByInvestorDTO dto);
    ResponseContractDTO updateContractByStudent(Long contractId, RequestContractUpdateByStudentDTO dto);

    // 🔹 Pasar a fase de firma (bloquear contrato)
    ResponseContractDTO agreeByStudent(Long contractId, RequestContractActionByStudentDTO dto);
    ResponseContractDTO agreeByInvestor(Long contractId, RequestContractActionByInvestorDTO dto);

    // 🔹 Firma individual
    ResponseContractDTO signByStudent(Long contractId, RequestContractActionByStudentDTO dto);
    ResponseContractDTO signByInvestor(Long contractId, RequestContractActionByInvestorDTO dto);

    // 🔹 Acciones del estudiante (post-firma)
    ResponseContractDTO closeContract(Long contractId, RequestContractActionByStudentDTO dto);
    ResponseContractDTO cancelContract(Long contractId, RequestContractActionByStudentDTO dto);
    ResponseContractDTO refundContract(Long contractId, RequestContractActionByStudentDTO dto);

    // 🔹 Acciones del inversor (post-firma)
    ResponseContractDTO cancelByInvestor(Long contractId, RequestContractActionByInvestorDTO dto);

    // 🔹 Consultas
    List<ResponseContractDTO> getContractsByProject(Long projectId);
    List<ResponseContractDTO> getContractsByInvestor(Long investorId);
    List<ResponseContractDTO> getContractsByOwner(Long ownerId);
    List<ResponseContractDTO> getContractsByInvestorAndProject(Long investorId, Long projectId);
    Map<String, Boolean> checkContractExists(Long projectId, String contractName);
}
