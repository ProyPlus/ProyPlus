package com.example.gestor_inversores.service.investment;

import com.example.gestor_inversores.dto.RequestContractActionByStudentDTO;
import com.example.gestor_inversores.dto.RequestInvestmentActionByInvestorDTO;
import com.example.gestor_inversores.dto.ResponseInvestmentDTO;
import com.example.gestor_inversores.model.enums.InvestmentStatus;

import java.util.List;

public interface IInvestmentService {

    ResponseInvestmentDTO cancelByInvestor(Long id);

    ResponseInvestmentDTO getById(Long id);

    List<ResponseInvestmentDTO> getAll();

    // Para estudiantes
    List<ResponseInvestmentDTO> getActiveForStudents();

    // Para estudiantes: solo inversiones activas de un proyecto
    List<ResponseInvestmentDTO> getActiveByProjectForStudents(Long projectId);

    ResponseInvestmentDTO delete(Long id);

    // 💡 Acciones del estudiante
    ResponseInvestmentDTO confirmReceipt(Long investmentId, Long studentId);

    ResponseInvestmentDTO markAsNotReceived(Long investmentId, Long studentId);

    ResponseInvestmentDTO rejectOverfunded(Long investmentId, Long studentId);

    ResponseInvestmentDTO confirmRefundSentByStudent(Long investmentId, RequestContractActionByStudentDTO dto);

    // 💡 Acciones del inversor
    ResponseInvestmentDTO confirmPaymentSent(Long investmentId, RequestInvestmentActionByInvestorDTO dto);
    ResponseInvestmentDTO confirmRefund(Long investmentId, RequestInvestmentActionByInvestorDTO dto);
    ResponseInvestmentDTO markRefundAsNotReceived(Long investmentId, RequestInvestmentActionByInvestorDTO dto);


    List<ResponseInvestmentDTO> getByInvestor(Long investorId, InvestmentStatus status);

}
