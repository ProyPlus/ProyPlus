package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.*;
import com.example.gestor_inversores.service.contract.IContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final IContractService contractService;

    @PostMapping
    public ResponseEntity<ResponseContractDTO> createContract(@Valid @RequestBody RequestContractDTO dto) {
        return ResponseEntity.ok(contractService.createContract(dto));
    }

    @PutMapping("/sign/{id}")
    public ResponseEntity<ResponseContractDTO> signContract(
            @PathVariable Long id,
            @Valid @RequestBody RequestContractActionByStudentDTO dto) {
        return ResponseEntity.ok(contractService.signContract(id, dto));
    }

    @PutMapping("/close/{id}")
    public ResponseEntity<ResponseContractDTO> closeContract(
            @PathVariable Long id,
            @Valid @RequestBody RequestContractActionByStudentDTO dto) {
        return ResponseEntity.ok(contractService.closeContract(id, dto));
    }

    @PutMapping("/cancel/{id}")
    public ResponseEntity<ResponseContractDTO> cancelContract(
            @PathVariable Long id,
            @Valid @RequestBody RequestContractActionByStudentDTO dto) {
        return ResponseEntity.ok(contractService.cancelContract(id, dto));
    }

    @PutMapping("/refund/{id}")
    public ResponseEntity<ResponseContractDTO> refundContract(
            @PathVariable Long id,
            @Valid @RequestBody RequestContractActionByStudentDTO dto) {
        return ResponseEntity.ok(contractService.refundContract(id, dto));
    }

    @PutMapping("/update-by-investor/{id}")
    public ResponseEntity<ResponseContractDTO> updateByInvestor(
            @PathVariable Long id,
            @Valid @RequestBody RequestContractUpdateByInvestorDTO dto) {
        return ResponseEntity.ok(contractService.updateContractByInvestor(id, dto));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ResponseContractDTO>> getContractsByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(contractService.getContractsByProject(projectId));
    }

    @GetMapping("/investor/{investorId}")
    public ResponseEntity<List<ResponseContractDTO>> getContractsByInvestor(@PathVariable Long investorId) {
        return ResponseEntity.ok(contractService.getContractsByInvestor(investorId));
    }
}
