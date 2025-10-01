package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.*;
import com.example.gestor_inversores.service.investment.IInvestmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investments")
public class InvestmentController {

    @Autowired
    private IInvestmentService service;

    @PutMapping("/details/{id}")
    public ResponseInvestmentDTO updateDetails(
            @PathVariable Long id,
            @RequestBody @Valid RequestInvestmentDetailsDTO dto) {

        return service.updateDetails(id, dto);
    }

    @PutMapping("/confirm/{id}")
    public ResponseInvestmentDTO confirmByStudent(
            @PathVariable Long id,
            @RequestBody @Valid RequestInvestmentStatusDTO dto) {

        return service.confirmByStudent(id, dto.getConfirmedByStudentId(), dto.getStatus());
    }

    @PutMapping("/cancel/{id}")
    public ResponseInvestmentDTO cancelByInvestor(
            @PathVariable Long id) {
        return service.cancelByInvestor(id);
    }

    @PostMapping
    public ResponseInvestmentDTO create(@RequestBody @Valid RequestInvestmentDTO dto) {
        return service.create(dto);
    }

    @GetMapping("/{id}")
    public ResponseInvestmentDTO getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<ResponseInvestmentDTO> getAll() {
        return service.getAll();
    }

    //Para ver todos las inversiones que estan en estado IN_PROGRESS, RECEIVED, NOT_RECEIVED y deleted != 1
    @GetMapping("/actives")
    public List<ResponseInvestmentDTO> getActiveForStudents() {
        return service.getActiveForStudents();
    }

    //Para ver las inversiones activas por proyecto (para que el estudiante pueda ver las inversiones actuales de su proyecto)
    @GetMapping("/investments-by-project/{projectId}")
    public List<ResponseInvestmentDTO> getActiveByProjectForStudents(@PathVariable Long projectId) {
        return service.getActiveByProjectForStudents(projectId);
    }

    @DeleteMapping("/{id}")
    public ResponseInvestmentDTO delete(@PathVariable Long id) {
        return service.delete(id);
    }
}
