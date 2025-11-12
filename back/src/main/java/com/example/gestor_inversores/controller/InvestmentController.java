package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.RequestContractActionByStudentDTO;
import com.example.gestor_inversores.dto.RequestInvestmentActionByInvestorDTO;
import com.example.gestor_inversores.dto.ResponseInvestmentDTO;
import com.example.gestor_inversores.model.enums.InvestmentStatus;
import com.example.gestor_inversores.service.investment.IInvestmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investments")
@RequiredArgsConstructor
public class InvestmentController {

    private final IInvestmentService service;

    // 💡 --- ACCIONES DEL ESTUDIANTE ---
    @PutMapping("/confirm-receipt/{id}")
    public ResponseEntity<ResponseInvestmentDTO> confirmReceipt(
            @PathVariable("id") Long investmentId,
            @RequestBody @Valid RequestContractActionByStudentDTO dto) {
        return ResponseEntity.ok(service.confirmReceipt(investmentId, dto.getStudentId()));
    }

    @PutMapping("/mark-not-received/{id}")
    public ResponseEntity<ResponseInvestmentDTO> markAsNotReceived(
            @PathVariable("id") Long investmentId,
            @RequestBody @Valid RequestContractActionByStudentDTO dto) {
        return ResponseEntity.ok(service.markAsNotReceived(investmentId, dto.getStudentId()));
    }

    @PutMapping("/reject-overfunded/{id}")
    public ResponseEntity<ResponseInvestmentDTO> rejectOverfunded(
            @PathVariable("id") Long investmentId,
            @RequestBody @Valid RequestContractActionByStudentDTO dto) {
        return ResponseEntity.ok(service.rejectOverfunded(investmentId, dto.getStudentId()));
    }

    @PutMapping("/confirm-refund-sent/{id}")
    public ResponseEntity<ResponseInvestmentDTO> confirmRefundSent(
            @PathVariable("id") Long investmentId,
            @RequestBody @Valid RequestContractActionByStudentDTO dto) {
        return ResponseEntity.ok(service.confirmRefundSentByStudent(investmentId, dto));
    }

    // 💡 --- ACCIONES DEL INVERSOR ---

    @PutMapping("/confirm-payment-sent/{id}")
    public ResponseEntity<ResponseInvestmentDTO> confirmPaymentSent(
            @PathVariable Long id,
            @Valid @RequestBody RequestInvestmentActionByInvestorDTO dto) {
        return ResponseEntity.ok(service.confirmPaymentSent(id, dto));
    }

    @PutMapping("/cancel/{id}")
    public ResponseEntity<ResponseInvestmentDTO> cancelByInvestor(@PathVariable Long id) {
        return ResponseEntity.ok(service.cancelByInvestor(id));
    }

    @PutMapping("/confirm-refund/{id}")
    public ResponseEntity<ResponseInvestmentDTO> confirmRefund(
            @PathVariable("id") Long investmentId,
            @Valid @RequestBody RequestInvestmentActionByInvestorDTO dto) {
        return ResponseEntity.ok(service.confirmRefund(investmentId, dto));
    }

    @PutMapping("/mark-refund-not-received/{id}")
    public ResponseEntity<ResponseInvestmentDTO> markRefundAsNotReceived(
            @PathVariable("id") Long investmentId,
            @Valid @RequestBody RequestInvestmentActionByInvestorDTO dto) {
        return ResponseEntity.ok(service.markRefundAsNotReceived(investmentId, dto));
    }

    // 💡 --- CONSULTAS ---
    @GetMapping("/{id}")
    public ResponseEntity<ResponseInvestmentDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<ResponseInvestmentDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/actives")
    public ResponseEntity<List<ResponseInvestmentDTO>> getActiveForStudents() {
        return ResponseEntity.ok(service.getActiveForStudents());
    }

    @GetMapping("/investments-by-project/{projectId}")
    public ResponseEntity<List<ResponseInvestmentDTO>> getActiveByProjectForStudents(@PathVariable Long projectId) {
        return ResponseEntity.ok(service.getActiveByProjectForStudents(projectId));
    }

    @GetMapping("/by-investor/{investorId}")
    public ResponseEntity<List<ResponseInvestmentDTO>> getByInvestor(
            @PathVariable Long investorId,
            @RequestParam(required = false) InvestmentStatus status) {
        return ResponseEntity.ok(service.getByInvestor(investorId, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseInvestmentDTO> delete(@PathVariable Long id) {
        return ResponseEntity.ok(service.delete(id));
    }
}
