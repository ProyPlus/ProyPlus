package com.example.gestor_inversores.mapper;

import com.example.gestor_inversores.dto.AddressDTO;
import com.example.gestor_inversores.dto.CreateInvestorDTO;
import com.example.gestor_inversores.dto.PatchInvestorDTO;
import com.example.gestor_inversores.dto.ResponseInvestorDTO;
import com.example.gestor_inversores.model.Address;
import com.example.gestor_inversores.model.Investor;
import org.springframework.stereotype.Component;

@Component
public class InvestorMapper {

    public Investor requestInvestorDTOtoInvestor(CreateInvestorDTO dto) {
        if (dto == null) return null;

        Investor investor = new Investor();

        // ----- Campos de User -----
        investor.setUsername(dto.getUsername());
        investor.setPassword(dto.getPassword()); // se encripta en el Service
        investor.setEmail(dto.getEmail());
        investor.setPhotoUrl(dto.getPhotoUrl());

        // ----- Campos de Investor -----
        investor.setCuit(dto.getCuit());
        investor.setContactPerson(dto.getContactPerson());
        investor.setPhone(dto.getPhone());
        investor.setWebSite(dto.getWebSite());

        // ----- Address -----
        if (dto.getAddress() != null) {
            investor.setAddress(dto.getAddress().toEntity());
        }

        /**
         * Roles (se asignan en el Service, no aquí)
         * investor.setRolesList(new HashSet<>());
         */

        return investor;
    }

    public ResponseInvestorDTO investorToResponseInvestorDTO(Investor investor) {
        if (investor == null) return null;

        ResponseInvestorDTO dto = new ResponseInvestorDTO();

        // ----- Campos de User -----
        dto.setId(investor.getId());
        dto.setUsername(investor.getUsername());
        dto.setEmail(investor.getEmail());
        dto.setPhotoUrl(investor.getPhotoUrl());

        // ----- Campos de seguridad -----
        dto.setEnabled(investor.getEnabled());
        dto.setAccountNotExpired(investor.getAccountNotExpired());
        dto.setAccountNotLocked(investor.getAccountNotLocked());
        dto.setCredentialNotExpired(investor.getCredentialNotExpired());

        // ----- Campos de Investor -----
        dto.setCuit(investor.getCuit());
        dto.setContactPerson(investor.getContactPerson());
        dto.setPhone(investor.getPhone());
        dto.setWebSite(investor.getWebSite());

        // ----- Address -----
        if (investor.getAddress() != null) {
            dto.setAddress(AddressDTO.fromEntity(investor.getAddress()));
        }

        return dto;
    }

    public void patchInvestorFromDto(PatchInvestorDTO dto, Investor investor) {
        if (dto.getUsername() != null && !dto.getUsername().isBlank()) {
            investor.setUsername(dto.getUsername());
        }
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            investor.setEmail(dto.getEmail());
        }
        if (dto.getPhotoUrl() != null) {
            investor.setPhotoUrl(dto.getPhotoUrl());
        }
        if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
            investor.setPhone(dto.getPhone());
        }
        if (dto.getWebSite() != null) {
            investor.setWebSite(dto.getWebSite());
        }
        // Dirección
        if (dto.getAddress() != null) {
            AddressDTO addressDTO = dto.getAddress();
            Address address = investor.getAddress();

            if (address == null) {
                address = addressDTO.toEntity();
                investor.setAddress(address);
            } else {
                if (addressDTO.getStreet() != null) address.setStreet(addressDTO.getStreet());
                if (addressDTO.getNumber() > 0) address.setNumber(addressDTO.getNumber());
                if (addressDTO.getCity() != null) address.setCity(addressDTO.getCity());
                if (addressDTO.getProvince() != null) address.setProvince(com.example.gestor_inversores.model.enums.Province.valueOf(addressDTO.getProvince()));
                if (addressDTO.getPostalCode() > 0) address.setPostalCode(addressDTO.getPostalCode());
            }
        }
    }





}
