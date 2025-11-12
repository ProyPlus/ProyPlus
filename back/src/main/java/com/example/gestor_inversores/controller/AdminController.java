package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.*;
import com.example.gestor_inversores.service.admin.IAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
//@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final IAdminService adminService;

    /*Con este endpoint se pueden actualizar todos los campos de project
     que no rompan con la logica de negocio. Por ejemplo, currentgoal no se
     puede actualizar manualmente ya que eso depende de la suma
     de inversiones (se hace de forma automática)*/
    @PutMapping("/projects/{id}")
    public ResponseEntity<ResponseProjectDTO> updateProject(
            @PathVariable Long id,
            @RequestBody @Valid RequestAdminProjectUpdateDTO projectUpdateDTO) {
        ResponseProjectDTO updatedProject = adminService.adminUpdateProject(id, projectUpdateDTO);
        return ResponseEntity.ok(updatedProject);
    }

    /*Con este endpoint se pueden actualizar los campos de contrato.
    En el adminservice hay toda una lógica que cubre los distintos casos
    dependiendo de los posibles cambios de status
    Los status posibles son estos:

    DRAFT,                      // Borrador del contrato, editable
    PARTIALLY_SIGNED,           // Acuerdo alcanzado, pendiente de firmas de ambas partes
    SIGNED,                     // Contrato firmado por ambos, inversión válida
    CANCELLED,                  // Contrato cancelado
    REFUNDED,                   // Proyecto cancelado y monto devuelto al inversor
    CLOSED                      // Proyecto finalizado, contrato cerrado*/
    @PutMapping("/contracts/{id}")
    public ResponseEntity<ResponseContractDTO> updateContract(
            @PathVariable Long id,
            @RequestBody @Valid RequestAdminContractUpdateDTO contractUpdateDTO) {
        ResponseContractDTO updatedContract = adminService.adminUpdateContract(id, contractUpdateDTO);
        return ResponseEntity.ok(updatedContract);
    }

    /*Con este endpoint SOLO se pueden modificar el status de una ganancia,
    ya que los demás campos se generan de forma automática por el sistema, entonces
    no tiene mucho sentido permitirle al admin que los modifique manualmente ya que rompe
    la lógica de negocio
    Los status de earnings son los siguientes:
    IN_PROGRESS,          // Ganancia generada, pendiente de envío por parte del estudiante
    PENDING_CONFIRMATION, // El estudiante ha confirmado el envío, pendiente de recepción del inversor
    RECEIVED,             // El inversor ha confirmado la recepción del dinero
    NOT_RECEIVED          // El inversor ha reportado que no recibió el dinero*/
    @PutMapping("/earnings/{id}/status")
    public ResponseEntity<ResponseEarningDTO> updateEarningStatus(
            @PathVariable Long id,
            @RequestBody @Valid RequestAdminUpdateEarningStatusDTO statusDTO) {
        ResponseEarningDTO updatedEarning = adminService.adminUpdateEarningStatus(id, statusDTO);
        return ResponseEntity.ok(updatedEarning);
    }

    /*Con este endpoint se pueden modificar solo el campo status, los
    demás campos de investment no se pueden modificar manualmente porque
    son creados de forma automática por el sistema, entonces si los modifica
    el admin de forma manaul se rompería la lógica de negocio
    Los status de investments son:
    IN_PROGRESS,      // La inversión ha sido creada, pendiente de transferencia
    PENDING_CONFIRMATION, // El inversor ha confirmado que envió el dinero, pendiente de recepción del estudiante
    RECEIVED,         // El estudiante ha confirmado la recepción del dinero
    NOT_RECEIVED,     // El estudiante ha reportado que no recibió el dinero
    CANCELLED,        // La inversión ha sido cancelada
    PENDING_RETURN,   // El estudiante ha iniciado la devolución, pendiente de confirmación del inversor
    RETURNED,         // El inversor ha confirmado la recepción de la devolución
    COMPLETED         // La inversión completó su ciclo y la ganancia fue pagada*/
    @PutMapping("/investments/{id}")
    public ResponseEntity<ResponseInvestmentDTO> updateInvestment(
            @PathVariable Long id,
            @RequestBody @Valid RequestAdminInvestmentUpdateDTO investmentUpdateDTO) {
        ResponseInvestmentDTO updatedInvestment = adminService.adminUpdateInvestment(id, investmentUpdateDTO);
        return ResponseEntity.ok(updatedInvestment);
    }
}
