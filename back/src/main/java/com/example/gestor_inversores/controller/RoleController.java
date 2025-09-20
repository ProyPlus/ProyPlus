package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.model.Role;
import com.example.gestor_inversores.service.role.IRoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private IRoleService roleService;

    @GetMapping
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(roleService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Role> getRoleById(@PathVariable Long id) {
        return roleService.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Role> createRole(@RequestBody Role role) {
        Role newRole = roleService.save(role);
        return ResponseEntity.ok(newRole);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Role> updateRolePermissions(
            @PathVariable Long id,
            @RequestBody Role roleUpdate) {

        // Aseguramos que roleUpdate tenga el id para que el service pueda actualizar
        roleUpdate.setId(id);

        Role updatedRole = roleService.update(roleUpdate);
        if (updatedRole == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updatedRole);
    }
}
