package com.example.gestor_inversores.service.admin;

import com.example.gestor_inversores.dto.*;

public interface IAdminService {

    ResponseProjectDTO adminUpdateProject(Long projectId, RequestAdminProjectUpdateDTO dto);

    ResponseContractDTO adminUpdateContract(Long contractId, RequestAdminContractUpdateDTO dto);

    ResponseInvestmentDTO adminUpdateInvestment(Long investmentId, RequestAdminInvestmentUpdateDTO dto);

    ResponseEarningDTO adminUpdateEarningStatus(Long earningId, RequestAdminUpdateEarningStatusDTO dto);
}
