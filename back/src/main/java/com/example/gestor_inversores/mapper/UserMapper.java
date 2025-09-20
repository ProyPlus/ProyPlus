package com.example.gestor_inversores.mapper;

import com.example.gestor_inversores.dto.CreateUserDTO;
import com.example.gestor_inversores.dto.PatchUserDTO;
import com.example.gestor_inversores.dto.ResponseUserDTO;
import com.example.gestor_inversores.dto.RoleDTO;
import com.example.gestor_inversores.model.Role;
import com.example.gestor_inversores.model.User;
import com.example.gestor_inversores.service.role.IRoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    @Autowired
    private IRoleService roleService;

    public User requestUserDTOToUser(CreateUserDTO dto) {
        if (dto == null) return null;

        User user = new User();

        // Campos de UserSec
        user.setUsername(dto.getUsername());
        user.setPassword(dto.getPassword()); // 🔹 Se encripta en el Service
        user.setEmail(dto.getEmail());
        user.setPhotoUrl(dto.getPhotoUrl());

        user.setRolesList(
                dto.getRolesIds() != null
                        ? dto.getRolesIds().stream()
                        .map(id -> {
                            Role r = new Role();
                            r.setId(id);
                            return r;
                        })
                        .collect(Collectors.toSet())
                        : new HashSet<>()
        );

        return user;
    }

    public ResponseUserDTO userToResponseUserDTO(User user) {
        if (user == null) return null;

        ResponseUserDTO dto = new ResponseUserDTO();

        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setPhotoUrl(user.getPhotoUrl());
        dto.setEnabled(Boolean.TRUE.equals(user.getEnabled()));
        dto.setAccountNotExpired(Boolean.TRUE.equals(user.getAccountNotExpired()));
        dto.setAccountNotLocked(Boolean.TRUE.equals(user.getAccountNotLocked()));
        dto.setCredentialNotExpired(Boolean.TRUE.equals(user.getCredentialNotExpired()));

        if (user.getRolesList() != null) {
            Set<RoleDTO> roles = user.getRolesList().stream()
                    .map(r -> new RoleDTO(r.getId(), r.getRole()))
                    .collect(Collectors.toSet());
            dto.setRoles(roles);
        }

        return dto;
    }

    // Método para actualizar un User con PatchUserDTO
    public void patchUserFromDto(PatchUserDTO dto, User user) {

        // Campos básicos
        if (dto.getUsername() != null) user.setUsername(dto.getUsername());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        if (dto.getPhotoUrl() != null) user.setPhotoUrl(dto.getPhotoUrl());

        // Campos de seguridad opcionales
        if (dto.getEnabled() != null) user.setEnabled(dto.getEnabled());
        if (dto.getAccountNotExpired() != null) user.setAccountNotExpired(dto.getAccountNotExpired());
        if (dto.getAccountNotLocked() != null) user.setAccountNotLocked(dto.getAccountNotLocked());
        if (dto.getCredentialNotExpired() != null) user.setCredentialNotExpired(dto.getCredentialNotExpired());

        // Roles
        if (dto.getRolesIds() != null && !dto.getRolesIds().isEmpty()) {
            Set<Role> rolesValidados = new HashSet<>();
            for (Long roleId : dto.getRolesIds()) {
                roleService.findById(roleId).ifPresent(rolesValidados::add);
            }
            user.setRolesList(rolesValidados);
        }
    }

}
