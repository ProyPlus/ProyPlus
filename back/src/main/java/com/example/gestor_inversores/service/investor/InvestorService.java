package com.example.gestor_inversores.service.investor;

import com.example.gestor_inversores.dto.RequestInvestorDTO;
import com.example.gestor_inversores.dto.RequestInvestorUpdateByAdminDTO;
import com.example.gestor_inversores.dto.RequestInvestorUpdateDTO;
import com.example.gestor_inversores.dto.ResponseInvestorDTO;
import com.example.gestor_inversores.exception.*;
import com.example.gestor_inversores.mapper.InvestorMapper;
import com.example.gestor_inversores.model.Contract;
import com.example.gestor_inversores.model.Investment;
import com.example.gestor_inversores.model.Investor;
import com.example.gestor_inversores.model.Role;
import com.example.gestor_inversores.repository.IContractRepository;
import com.example.gestor_inversores.repository.IInvestmentRepository;
import com.example.gestor_inversores.repository.IInvestorRepository;
import com.example.gestor_inversores.repository.IUserRepository;
import com.example.gestor_inversores.service.role.IRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvestorService implements IInvestorService {

    private final IInvestorRepository investorRepository;
    private final IRoleService roleService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final InvestorMapper mapper;
    private final IUserRepository userRepository;
    private final IInvestmentRepository investmentRepository;
    private final IContractRepository contractRepository;

    @Override
    public ResponseInvestorDTO save(RequestInvestorDTO dto) {
        userRepository.findUserEntityByUsername(dto.getUsername())
                .ifPresent(u -> { throw new UsernameAlreadyExistsException("Username ya existe"); });
        userRepository.findByEmail(dto.getEmail())
                .ifPresent(u -> { throw new EmailAlreadyExistsException("Email ya existe"); });
        investorRepository.findByCuit(dto.getCuit())
                .ifPresent(i -> { throw new CuitAlreadyExistsException("El cuit ya existe"); });

        Investor investor = mapper.requestInvestorDTOtoInvestor(dto);
        investor.setEnabled(true);
        investor.setAccountNotExpired(true);
        investor.setAccountNotLocked(true);
        investor.setCredentialNotExpired(true);

        Role investorRole = roleService.findByRole("INVESTOR")
                .orElseThrow(() -> new RoleNotFoundException("Rol INVESTOR no encontrado. Asegúrese de que esté creado en la base de datos."));
        investor.setRolesList(Set.of(investorRole));

        if (investor.getPassword() != null && !investor.getPassword().isBlank()) {
            investor.setPassword(passwordEncoder.encode(investor.getPassword()));
        }

        Investor savedInvestor = investorRepository.save(investor);
        return mapper.investorToResponseInvestorDTO(savedInvestor);
    }

    @Override
    @Transactional
    public ResponseInvestorDTO updateByAdmin(Long id, RequestInvestorUpdateByAdminDTO dto) {
        Investor investorToUpdate = investorRepository.findById(id)
                .orElseThrow(() -> new InvestorNotFoundException("Inversor con id " + id + " no encontrado para actualizar"));

        mapper.updateInvestorFromAdminDto(dto, investorToUpdate);

        Investor updatedInvestor = investorRepository.save(investorToUpdate);
        return mapper.investorToResponseInvestorDTO(updatedInvestor);
    }

    @Override
    public ResponseInvestorDTO findById(Long id) {
        Investor investor = investorRepository.findById(id)
                .orElseThrow(() -> new InvestorNotFoundException("Inversor con id " + id + " no encontrado"));
        return mapper.investorToResponseInvestorDTO(investor);
    }

    @Override
    public List<ResponseInvestorDTO> findAll() {
        return investorRepository.findAll().stream()
                .map(mapper::investorToResponseInvestorDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ResponseInvestorDTO patchInvestor(Long id, RequestInvestorUpdateDTO patchDto) {
        Investor investor = investorRepository.findById(id)
                .orElseThrow(() -> new InvestorNotFoundException("Inversor con id " + id + " no encontrado"));
        mapper.patchInvestorFromDto(patchDto, investor);
        Investor updatedInvestor = investorRepository.save(investor);
        return mapper.investorToResponseInvestorDTO(updatedInvestor);
    }

    @Override
    public ResponseInvestorDTO activateInvestor(Long id) {
        Investor investor = investorRepository.findById(id)
                .orElseThrow(() -> new InvestorNotFoundException("Inversor con id " + id + " no encontrado"));
        investor.setEnabled(true);
        Investor updatedInvestor = investorRepository.save(investor);
        return mapper.investorToResponseInvestorDTO(updatedInvestor);
    }

    @Override
    public ResponseInvestorDTO desactivateInvestor(Long id) {
        Investor investor = investorRepository.findById(id)
                .orElseThrow(() -> new InvestorNotFoundException("Inversor con id " + id + " no encontrado"));

        String errorMessage = "El inversor tiene inversiones o contratos activos y no puede ser eliminado.";

        List<Investment> activeInvestments = investmentRepository.findByGeneratedBy_IdAndDeletedFalse(id);
        if (!activeInvestments.isEmpty()) {
            throw new InvestorDesactivationException(errorMessage);
        }

        List<Contract> contracts = contractRepository.findByCreatedByInvestorId(id);
        if (!contracts.isEmpty()) {
            throw new InvestorDesactivationException(errorMessage);
        }

        investor.setEnabled(false);
        Investor updatedInvestor = investorRepository.save(investor);
        return mapper.investorToResponseInvestorDTO(updatedInvestor);
    }
}
