package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.*;
import com.example.gestor_inversores.service.contract.IContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final IContractService contractService;

    @PostMapping
    public ResponseEntity<ResponseContractDTO> createContract(@Valid @RequestBody RequestContractDTO dto) {
        return ResponseEntity.ok(contractService.createContract(dto));
    }

    @PutMapping("/update-by-investor/{id}")
    public ResponseEntity<ResponseContractDTO> updateByInvestor(
            @PathVariable Long id,
            @Valid @RequestBody RequestContractUpdateByInvestorDTO dto) {
        return ResponseEntity.ok(contractService.updateContractByInvestor(id, dto));
    }

    @PutMapping("/update-by-student/{id}")
    public ResponseEntity<ResponseContractDTO> updateByStudent(
            @PathVariable Long id,
            @Valid @RequestBody RequestContractUpdateByStudentDTO dto) {
        return ResponseEntity.ok(contractService.updateContractByStudent(id, dto));
    }

    @PutMapping("/agree-by-student/{id}")
    public ResponseEntity<ResponseContractDTO> agreeByStudent(
            @PathVariable Long id,
            @Valid @RequestBody RequestContractActionByStudentDTO dto) {
        return ResponseEntity.ok(contractService.agreeByStudent(id, dto));
    }

    @PutMapping("/agree-by-investor/{id}")
    public ResponseEntity<ResponseContractDTO> agreeByInvestor(
            @PathVariable Long id,
            @Valid @RequestBody RequestContractActionByInvestorDTO dto) {
        return ResponseEntity.ok(contractService.agreeByInvestor(id, dto));
    }

    @PutMapping("/sign-by-student/{id}")
    public ResponseEntity<ResponseContractDTO> signByStudent(
            @PathVariable Long id,
            @Valid @RequestBody RequestContractActionByStudentDTO dto) {
        return ResponseEntity.ok(contractService.signByStudent(id, dto));
    }

    @PutMapping("/sign-by-investor/{id}")
    public ResponseEntity<ResponseContractDTO> signByInvestor(
            @PathVariable Long id,
            @Valid @RequestBody RequestContractActionByInvestorDTO dto) {
        return ResponseEntity.ok(contractService.signByInvestor(id, dto));
    }

    @PutMapping("/close/{id}")
    public ResponseEntity<ResponseContractDTO> closeContract(
            @PathVariable Long id,
            @Valid @RequestBody RequestContractActionByStudentDTO dto) {
        return ResponseEntity.ok(contractService.closeContract(id, dto));
    }

    @PutMapping("/cancel-by-student/{id}")
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

    @PutMapping("/cancel-by-investor/{id}")
    public ResponseEntity<ResponseContractDTO> cancelByInvestor(
            @PathVariable("id") Long contractId,
            @Valid @RequestBody RequestContractActionByInvestorDTO dto) {
        return ResponseEntity.ok(contractService.cancelByInvestor(contractId, dto));
    }

    @GetMapping("/by-project/{projectId}")
    public ResponseEntity<List<ResponseContractDTO>> getContractsByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(contractService.getContractsByProject(projectId));
    }

    @GetMapping("/by-investor/{investorId}")
    public ResponseEntity<List<ResponseContractDTO>> getContractsByInvestor(@PathVariable Long investorId) {
        return ResponseEntity.ok(contractService.getContractsByInvestor(investorId));
    }

    @GetMapping("/by-owner/{studentId}")
    public ResponseEntity<List<ResponseContractDTO>> getContractsByOwner(@PathVariable Long studentId) {
        return ResponseEntity.ok(contractService.getContractsByOwner(studentId));
    }

    @GetMapping("/investor/{investorId}/project/{projectId}")
    public ResponseEntity<List<ResponseContractDTO>> getInvestorContractsForProject(
            @PathVariable Long investorId,
            @PathVariable Long projectId) {
            List<ResponseContractDTO> contracts = contractService.getContractsByInvestorAndProject(investorId, projectId);

            return ResponseEntity.status(HttpStatus.OK).body(contracts);
    }

    @GetMapping("/exists")
    public ResponseEntity<Map<String, Boolean>> checkContractExists(
            @RequestParam Long projectId,
            @RequestParam String contractName) {
        return ResponseEntity.ok(contractService.checkContractExists(projectId, contractName));
    }
}
