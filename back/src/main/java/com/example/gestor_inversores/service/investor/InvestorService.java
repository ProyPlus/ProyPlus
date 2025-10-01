package com.example.gestor_inversores.service.investor;

import com.example.gestor_inversores.dto.RequestInvestorDTO;
import com.example.gestor_inversores.dto.RequestInvestorUpdateDTO;
import com.example.gestor_inversores.dto.ResponseInvestorDTO;
import com.example.gestor_inversores.exception.CuitAlreadyExistsException;
import com.example.gestor_inversores.exception.EmailAlreadyExistsException;
import com.example.gestor_inversores.exception.UsernameAlreadyExistsException;
import com.example.gestor_inversores.mapper.InvestorMapper;
import com.example.gestor_inversores.model.Investor;
import com.example.gestor_inversores.model.Role;
import com.example.gestor_inversores.repository.IInvestorRepository;
import com.example.gestor_inversores.repository.IUserRepository;
import com.example.gestor_inversores.service.role.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class InvestorService implements IInvestorService{

    @Autowired
    private IInvestorRepository investorRepository;

    @Autowired
    private RoleService roleService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private InvestorMapper mapper;

    @Autowired
    private IUserRepository userRepository;

    @Override
    public ResponseInvestorDTO save(RequestInvestorDTO dto) {

        // Validar username existente
        userRepository.findUserEntityByUsername(dto.getUsername())
                .ifPresent(u -> { throw new UsernameAlreadyExistsException("Username ya existe"); });

        // Validar email existente
        userRepository.findByEmail(dto.getEmail())
                .ifPresent(u -> { throw new EmailAlreadyExistsException("Email ya existe"); });
        // Validar CUIT
        investorRepository.findByCuit(dto.getCuit())
                .ifPresent(i -> { throw new CuitAlreadyExistsException("El cuit ya existe"); });

        // Convertir DTO a Entity usando el Mapper inyectado
        Investor investor = mapper.requestInvestorDTOtoInvestor(dto);

        // Asignar valores de seguridad por defecto
        investor.setEnabled(true);
        investor.setAccountNotExpired(true);
        investor.setAccountNotLocked(true);
        investor.setCredentialNotExpired(true);

        // Asignar automáticamente el rol INVESTOR (id=2 por ejemplo, ajusta según tu BD)
        Role investorRole = roleService.findById(2L)
                .orElseThrow(() -> new RuntimeException("Rol INVESTOR no encontrado"));
        investor.setRolesList(Set.of(investorRole));

        // Encriptar contraseña
        if (investor.getPassword() != null && !investor.getPassword().isBlank()) {
            investor.setPassword(passwordEncoder.encode(investor.getPassword()));
        }

        // Guardar en la BD
        Investor savedInvestor = investorRepository.save(investor);

        // Convertir a ResponseInvestorDTO
        return mapper.investorToResponseInvestorDTO(savedInvestor);
    }

    @Override
    public Optional<Investor> findById(Long id) {
        return investorRepository.findById(id);
    }

    @Override
    public List<Investor> findAll() {
        return investorRepository.findAll();
    }

    @Override
    public Optional<Investor> patchInvestor(Long id, RequestInvestorUpdateDTO patchDto) {
        return investorRepository.findById(id).map(investor -> {
            // Usamos el mapper para actualizar solo los campos que vienen en el DTO
            mapper.patchInvestorFromDto(patchDto, investor);
            return investorRepository.save(investor);
        });
    }

    @Override
    public Investor activateInvestor(Long id) {
        Investor investor = investorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investor not found with id " + id));
        investor.setEnabled(true);
        return investorRepository.save(investor);
    }

    @Override
    public Investor desactivateInvestor(Long id) {
        Investor investor = investorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investor not found with id " + id));
        investor.setEnabled(false);
        return investorRepository.save(investor);
    }

}
