package com.example.gestor_inversores.service.investor;

import com.example.gestor_inversores.dto.CreateInvestorDTO;
import com.example.gestor_inversores.dto.PatchInvestorDTO;
import com.example.gestor_inversores.dto.ResponseInvestorDTO;
import com.example.gestor_inversores.model.Investor;
import com.example.gestor_inversores.model.Student;
import com.example.gestor_inversores.model.User;

import java.util.List;
import java.util.Optional;

public interface IInvestorService {

    public List<Investor> findAll();

    public Optional<Investor> findById(Long id);

    public ResponseInvestorDTO save(CreateInvestorDTO investor);

    public Optional<Investor> patchInvestor(Long id, PatchInvestorDTO patchDto);

    public Investor activateInvestor(Long id);

    public Investor desactivateInvestor(Long id);

}
