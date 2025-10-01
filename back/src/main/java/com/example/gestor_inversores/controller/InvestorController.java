package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.RequestInvestorDTO;
import com.example.gestor_inversores.dto.RequestInvestorUpdateDTO;
import com.example.gestor_inversores.dto.ResponseInvestorDTO;
import com.example.gestor_inversores.mapper.InvestorMapper;
import com.example.gestor_inversores.model.Investor;
import com.example.gestor_inversores.service.investor.IInvestorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investors")
public class InvestorController {

    @Autowired
    private IInvestorService investorService;

    @Autowired
    private InvestorMapper mapper;

    @GetMapping
    public ResponseEntity<List<ResponseInvestorDTO>> getAllInvestors() {
        List<ResponseInvestorDTO> investorsDTO = investorService.findAll().stream()
                .map(mapper::investorToResponseInvestorDTO)
                .toList();

        return ResponseEntity.ok(investorsDTO);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseInvestorDTO> getInvestorById(@PathVariable Long id) {
        return investorService.findById(id)
                .map(mapper::investorToResponseInvestorDTO)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ResponseInvestorDTO> createInvestor(@Valid @RequestBody RequestInvestorDTO requestDTO) {
        ResponseInvestorDTO savedInvestor = investorService.save(requestDTO);
        return ResponseEntity.ok(savedInvestor);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ResponseInvestorDTO> patchInvestor(
            @PathVariable Long id,
            @Valid @RequestBody RequestInvestorUpdateDTO patchDto) {

        return investorService.patchInvestor(id, patchDto)
                .map(mapper::investorToResponseInvestorDTO)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // DAR DE ALTA (enable)
    @PatchMapping("/activate/{id}")
    public ResponseEntity<ResponseInvestorDTO> activateInvestor(@PathVariable Long id) {
        Investor investor = investorService.activateInvestor(id);
        return ResponseEntity.ok(mapper.investorToResponseInvestorDTO(investor));
    }

    // DAR DE BAJA (disable)
    @PatchMapping("/desactivate/{id}")
    public ResponseEntity<ResponseInvestorDTO> desactivateInvestor(@PathVariable Long id) {
        Investor investor = investorService.desactivateInvestor(id);
        return ResponseEntity.ok(mapper.investorToResponseInvestorDTO(investor));
    }

}

