package com.example.gestor_inversores.mapper;

import com.example.gestor_inversores.dto.*;
import com.example.gestor_inversores.model.Address;
import com.example.gestor_inversores.model.Project;
import com.example.gestor_inversores.model.Student;
import com.example.gestor_inversores.model.enums.Province;
import com.example.gestor_inversores.service.role.IRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class StudentMapper {

    private final IRoleService roleService;
    private final AddressMapper addressMapper;

    public Student requestStudentDTOToStudent(RequestStudentDTO dto) {
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
            student.setAddress(addressMapper.toEntity(dto.getAddress()));
        }

        return student;
    }

    public ResponseStudentDTO studentToResponseStudentDTO(Student student) {
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
            dto.setAddress(addressMapper.fromEntity(student.getAddress()));
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

    public void updateStudentFromAdminDto(RequestStudentUpdateByAdminDTO dto, Student student) {
        if (dto == null || student == null) return;

        // Campos de User
        student.setUsername(dto.getUsername());
        student.setEmail(dto.getEmail());

        // Campos de estado de la cuenta
        student.setEnabled(dto.getEnabled());
        student.setAccountNotExpired(dto.getAccountNotExpired());
        student.setAccountNotLocked(dto.getAccountNotLocked());
        student.setCredentialNotExpired(dto.getCredentialNotExpired());

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

        // Address (asume una actualización completa de la dirección)
        student.setAddress(dto.getAddress());
    }

    public void patchStudentFromDto(RequestStudentUpdateDTO dto, Student student) {
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
        if (dto.getUniversity() != null) student.setUniversity(dto.getUniversity());
        if (dto.getDegreeStatus() != null) student.setDegreeStatus(dto.getDegreeStatus());
        if (dto.getCareer() != null) student.setCareer(dto.getCareer());
        if (dto.getLinkedinUrl() != null) student.setLinkedinUrl(dto.getLinkedinUrl());
        if (dto.getDescription() != null) student.setDescription(dto.getDescription());

        // Dirección
        if (dto.getAddress() != null) {
            AddressDTO addressDTO = dto.getAddress();
            Address address = student.getAddress();

            if (address == null) {
                address = addressMapper.toEntity(addressDTO);
                student.setAddress(address);
            } else {
                // NOTA: Esta lógica de parcheo manual podría moverse al AddressMapper en el futuro
                if (addressDTO.getStreet() != null) address.setStreet(addressDTO.getStreet());
                if (addressDTO.getNumber() > 0) address.setNumber(addressDTO.getNumber());
                if (addressDTO.getCity() != null) address.setCity(addressDTO.getCity());
                if (addressDTO.getProvince() != null) {
                    try {
                        address.setProvince(Province.valueOf(addressDTO.getProvince().toUpperCase()));
                    } catch (IllegalArgumentException e) {
                        // Ignorar provincia inválida en un parcheo
                    }
                }
                if (addressDTO.getPostalCode() > 0) address.setPostalCode(addressDTO.getPostalCode());
            }
        }
    }

    public static List<ResponseProjectByStudentDTO> mapProjectsToResponseProjectDTO(Set<Project> projects, boolean active) {
        if (projects == null) return List.of();

        return projects.stream()
                .filter(project -> active ? !project.getDeleted() : project.getDeleted())
                .map(project -> ResponseProjectByStudentDTO.builder()
                        .idProject(project.getIdProject())
                        .name(project.getName())
                        .description(project.getDescription())
                        .budgetGoal(project.getBudgetGoal())
                        .currentGoal(project.getCurrentGoal())
                        .status(project.getStatus())
                        .startDate(project.getStartDate())
                        .estimatedEndDate(project.getEstimatedEndDate())
                        .endDate(project.getEndDate())
                        .build()
                ).collect(Collectors.toList());
    }
}
