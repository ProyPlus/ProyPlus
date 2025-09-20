package com.example.gestor_inversores.service.role;

import com.example.gestor_inversores.model.Permission;
import com.example.gestor_inversores.model.Role;
import com.example.gestor_inversores.repository.IRoleRepository;
import com.example.gestor_inversores.service.permission.IPermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class RoleService implements IRoleService {

    @Autowired
    private IRoleRepository roleRepository;

    @Autowired
    private IPermissionService permissionService;

    @Override
    public List<Role> findAll() {
        return roleRepository.findAll();
    }

    @Override
    public Optional<Role> findById(Long id) {
        return roleRepository.findById(id);
    }

    @Override
    public Role save(Role role) {
        // Mapear los permisos existentes
        Set<Permission> permissionList = new HashSet<>();
        for (Permission per : role.getPermissionsList()) {
            permissionService.findById(per.getId()).ifPresent(permissionList::add);
        }
        role.setPermissionsList(permissionList);
        return roleRepository.save(role);
    }

    @Override
    public Role update(Role roleUpdate) {
        Optional<Role> roleOpt = roleRepository.findById(roleUpdate.getId());
        if (roleOpt.isEmpty()) {
            return null; // el controller puede manejar el notFound
        }

        Role role = roleOpt.get();

        // Actualizar nombre si viene
        if (roleUpdate.getRole() != null) {
            role.setRole(roleUpdate.getRole());
        }

        // Actualizar permisos
        if (roleUpdate.getPermissionsList() != null) {
            Set<Permission> updatedPermissions = new HashSet<>(role.getPermissionsList());

            for (Permission per : roleUpdate.getPermissionsList()) {
                permissionService.findById(per.getId()).ifPresent(p -> {
                    if (updatedPermissions.contains(p)) {
                        updatedPermissions.remove(p);
                    } else {
                        updatedPermissions.add(p);
                    }
                });
            }

            role.setPermissionsList(updatedPermissions);
        }

        return roleRepository.save(role);
    }

    @Override
    public void deleteById(Long id) {
        roleRepository.deleteById(id);
    }
}
