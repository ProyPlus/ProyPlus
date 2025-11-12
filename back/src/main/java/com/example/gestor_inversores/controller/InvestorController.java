package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.RequestInvestorDTO;
import com.example.gestor_inversores.dto.RequestInvestorUpdateByAdminDTO;
import com.example.gestor_inversores.dto.RequestInvestorUpdateDTO;
import com.example.gestor_inversores.dto.ResponseInvestorDTO;
import com.example.gestor_inversores.repository.IInvestorRepository;
import com.example.gestor_inversores.service.investor.IInvestorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investors")
@RequiredArgsConstructor
public class InvestorController {

    private final IInvestorService investorService;
    private final IInvestorRepository investorRepository;

    @GetMapping
    public ResponseEntity<List<ResponseInvestorDTO>> getAllInvestors() {
        return ResponseEntity.ok(investorService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseInvestorDTO> getInvestorById(@PathVariable Long id) {
        return ResponseEntity.ok(investorService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ResponseInvestorDTO> createInvestor(@Valid @RequestBody RequestInvestorDTO requestDTO) {
        ResponseInvestorDTO savedInvestor = investorService.save(requestDTO);
        return ResponseEntity.ok(savedInvestor);
    }

    @PutMapping("/update-by-admin/{id}")
    public ResponseEntity<ResponseInvestorDTO> updateByAdmin(
            @PathVariable Long id,
            @Valid @RequestBody RequestInvestorUpdateByAdminDTO dto) {
        ResponseInvestorDTO updatedInvestor = investorService.updateByAdmin(id, dto);
        return ResponseEntity.ok(updatedInvestor);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ResponseInvestorDTO> patchInvestor(
            @PathVariable Long id,
            @Valid @RequestBody RequestInvestorUpdateDTO patchDto) {
        return ResponseEntity.ok(investorService.patchInvestor(id, patchDto));
    }

    // DAR DE ALTA (enable)
    @PatchMapping("/activate/{id}")
    public ResponseEntity<ResponseInvestorDTO> activateInvestor(@PathVariable Long id) {
        return ResponseEntity.ok(investorService.activateInvestor(id));
    }

    // DAR DE BAJA (disable)
    @PatchMapping("/desactivate/{id}")
    public ResponseEntity<ResponseInvestorDTO> desactivateInvestor(@PathVariable Long id) {
        return ResponseEntity.ok(investorService.desactivateInvestor(id));
    }

    // ✅ Endpoint para validar si el cuit ya existe
    @GetMapping("/check-cuit/{cuit}")
    public ResponseEntity<Boolean> checkCuitExists(@PathVariable String cuit) {
        return ResponseEntity.ok(investorRepository.findByCuit(cuit).isPresent());
    }

}
