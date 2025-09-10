package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.model.Permission;
import com.example.gestor_inversores.model.Role;
import com.example.gestor_inversores.service.IPermissionService;
import com.example.gestor_inversores.service.IRoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@RestController
//@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private IRoleService roleService;

    @Autowired
    private IPermissionService permissionService;

    @GetMapping
    public ResponseEntity<List<Role>> getAllRoles() {
        List<Role> roles = roleService.findAll();
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Role> getRoleById(@PathVariable Long id) {
        Optional<Role> role = roleService.findById(id);
        return role.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Role> createRole(@RequestBody Role role) {
        Set<Permission> permissionList = new HashSet<>();
        Permission readPermission;

        // Recuperar la Permission/s por su ID
        for (Permission per : role.getPermissionsList()) {
            readPermission = permissionService.findById(per.getId()).orElse(null);
            if (readPermission != null) {
                //si encuentro, guardo en la lista
                permissionList.add(readPermission);
            }
        }

        role.setPermissionsList(permissionList);
        Role newRole = roleService.save(role);
        return ResponseEntity.ok(newRole);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Role> updateRolePermissions(
            @PathVariable Long id,
            @RequestBody Role roleUpdate) {

        Optional<Role> rolOpt = roleService.findById(id);
        if (rolOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Role rol = rolOpt.get();

        // Actualizamos el nombre del rol si viene
        if (roleUpdate.getRole() != null) {
            rol.setRole(roleUpdate.getRole());
        }

        // Agregar o quitar permisos
        if (roleUpdate.getPermissionsList() != null) {
            Set<Permission> updatedPermissions = new HashSet<>(rol.getPermissionsList());

            for (Permission per : roleUpdate.getPermissionsList()) {
                permissionService.findById(per.getId()).ifPresent(p -> {
                    if (updatedPermissions.contains(p)) {
                        updatedPermissions.remove(p); // quitar si ya existía
                    } else {
                        updatedPermissions.add(p); // agregar si no existía
                    }
                });
            }

            rol.setPermissionsList(updatedPermissions);
        }

        roleService.update(rol);
        return ResponseEntity.ok(rol);
    }


}
