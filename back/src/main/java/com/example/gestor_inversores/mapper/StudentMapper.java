package com.example.gestor_inversores.mapper;

import com.example.gestor_inversores.dto.*;
import com.example.gestor_inversores.model.Address;
import com.example.gestor_inversores.model.Student;
import com.example.gestor_inversores.service.role.IRoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
public class StudentMapper {

    @Autowired
    private IRoleService roleService;

    public Student requestStudentDTOToStudent(CreateStudentDTO dto) {
        if (dto == null) return null;

        Student student = new Student();

        // Campos de UserSec
        student.setUsername(dto.getUsername());
        student.setPassword(dto.getPassword()); // se encripta en el Service
        student.setEmail(dto.getEmail());
        student.setPhotoUrl(dto.getPhotoUrl());

        // Campos específicos de Student
        student.setFirstName(dto.getFirstName());
        student.setLastName(dto.getLastName());
        student.setDni(dto.getDni());
        student.setPhone(dto.getPhone());
        student.setDateOfBirth(dto.getDateOfBirth());
        student.setUniversity(dto.getUniversity());
        student.setCareer(dto.getCareer());
        student.setDegreeStatus(dto.getDegreeStatus());
        student.setLinkedinUrl(dto.getLinkedinUrl());
        student.setDescription(dto.getDescription());

        // Address
        if (dto.getAddress() != null) {
            student.setAddress(dto.getAddress().toEntity());
        }

        /**
        // Roles (se asignan en el Service, no aquí)
        student.setRolesList(new HashSet<>());
         **/

        return student;
    }

    public static ResponseStudentDTO studentToResponseStudentDTO(Student student) {
        if (student == null) return null;

        ResponseStudentDTO dto = new ResponseStudentDTO();
        dto.setId(student.getId());
        dto.setUsername(student.getUsername());
        dto.setEmail(student.getEmail());
        dto.setPhotoUrl(student.getPhotoUrl());
        dto.setEnabled(Boolean.TRUE.equals(student.getEnabled()));
        dto.setAccountNotExpired(Boolean.TRUE.equals(student.getAccountNotExpired()));
        dto.setAccountNotLocked(Boolean.TRUE.equals(student.getAccountNotLocked()));
        dto.setCredentialNotExpired(Boolean.TRUE.equals(student.getCredentialNotExpired()));

        dto.setFirstName(student.getFirstName());
        dto.setLastName(student.getLastName());
        dto.setDni(student.getDni());
        dto.setPhone(student.getPhone());
        dto.setDateOfBirth(student.getDateOfBirth());
        dto.setUniversity(student.getUniversity());
        dto.setCareer(student.getCareer());
        dto.setDegreeStatus(student.getDegreeStatus());
        dto.setLinkedinUrl(student.getLinkedinUrl());
        dto.setDescription(student.getDescription());

        if (student.getAddress() != null) {
            AddressDTO addressDTO = new AddressDTO();
            addressDTO.setStreet(student.getAddress().getStreet());
            addressDTO.setNumber(student.getAddress().getNumber());
            addressDTO.setCity(student.getAddress().getCity());
            addressDTO.setProvince(student.getAddress().getProvince().name());
            addressDTO.setPostalCode(student.getAddress().getPostalCode());
            dto.setAddress(addressDTO);
        }

        if (student.getProjectsList() != null) {
            Set<ProjectDTO> projects = student.getProjectsList().stream()
                    .map(p -> {
                        ProjectDTO pdto = new ProjectDTO();
                        pdto.setIdProject(p.getIdProject());
                        pdto.setName(p.getName());
                        return pdto;
                    }).collect(Collectors.toSet());
            dto.setProjects(projects);
        }

        if (student.getRolesList() != null) {
            Set<RoleDTO> roles = student.getRolesList().stream()
                    .map(r -> new RoleDTO(r.getId(), r.getRole()))
                    .collect(Collectors.toSet());
            dto.setRoles(roles);
        }

        return dto;
    }

    public void patchStudentFromDto(PatchStudentDTO dto, Student student) {
        if (dto == null || student == null) return;

        // Campos de User
        if (dto.getUsername() != null) student.setUsername(dto.getUsername());
        if (dto.getEmail() != null) student.setEmail(dto.getEmail());
        if (dto.getPhotoUrl() != null) student.setPhotoUrl(dto.getPhotoUrl());

        // Campos específicos de Student
        if (dto.getFirstName() != null) student.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) student.setLastName(dto.getLastName());
        if (dto.getDni() != null) student.setDni(dto.getDni());
        if (dto.getPhone() != null) student.setPhone(dto.getPhone());
        if (dto.getDateOfBirth() != null) student.setDateOfBirth(dto.getDateOfBirth());
        if (dto.getCareer() != null) student.setCareer(dto.getCareer());
        if (dto.getLinkedinUrl() != null) student.setLinkedinUrl(dto.getLinkedinUrl());
        if (dto.getDescription() != null) student.setDescription(dto.getDescription());

        // Dirección
        if (dto.getAddress() != null) {
            AddressDTO addressDTO = dto.getAddress();
            Address address = student.getAddress();

            if (address == null) {
                address = addressDTO.toEntity();
                student.setAddress(address);
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
