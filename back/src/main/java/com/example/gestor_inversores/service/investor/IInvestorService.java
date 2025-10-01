package com.example.gestor_inversores.service.investor;

import com.example.gestor_inversores.dto.RequestInvestorDTO;
import com.example.gestor_inversores.dto.RequestInvestorUpdateDTO;
import com.example.gestor_inversores.dto.ResponseInvestorDTO;
import com.example.gestor_inversores.model.Investor;

import java.util.List;
import java.util.Optional;

public interface IInvestorService {

    public List<Investor> findAll();

    public Optional<Investor> findById(Long id);

    public ResponseInvestorDTO save(RequestInvestorDTO investor);

    public Optional<Investor> patchInvestor(Long id, RequestInvestorUpdateDTO patchDto);

    public Investor activateInvestor(Long id);

    public Investor desactivateInvestor(Long id);

}
