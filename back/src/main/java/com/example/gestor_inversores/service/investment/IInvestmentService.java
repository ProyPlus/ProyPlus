package com.example.gestor_inversores.service.investment;

import com.example.gestor_inversores.dto.*;
import com.example.gestor_inversores.model.enums.InvestmentStatus;

import java.util.List;

public interface IInvestmentService {

    ResponseInvestmentDTO create(RequestInvestmentDTO dto);

    ResponseInvestmentDTO updateDetails(Long id, RequestInvestmentDetailsDTO dto);

    ResponseInvestmentDTO confirmByStudent(Long id, Long studentId, InvestmentStatus status);

    ResponseInvestmentDTO cancelByInvestor(Long id);

    ResponseInvestmentDTO getById(Long id);

    List<ResponseInvestmentDTO> getAll();
    // Para estudiantes
    List<ResponseInvestmentDTO> getActiveForStudents();

    // Para estudiantes: solo inversiones activas de un proyecto
    List<ResponseInvestmentDTO> getActiveByProjectForStudents(Long projectId);

    ResponseInvestmentDTO delete(Long id);


}
