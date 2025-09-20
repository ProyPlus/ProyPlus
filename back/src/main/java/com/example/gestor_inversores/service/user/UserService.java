package com.example.gestor_inversores.service.user;

import com.example.gestor_inversores.dto.PatchUserDTO;
import com.example.gestor_inversores.mapper.UserMapper;
import com.example.gestor_inversores.model.Role;
import com.example.gestor_inversores.model.User;
import com.example.gestor_inversores.repository.IUserRepository;
import com.example.gestor_inversores.service.role.IRoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class UserService implements IUserService {

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IRoleService roleService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private UserMapper userMapper;

    @Override
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public User save(User user) {
        // encriptar password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // setear valores por defecto
        user.setEnabled(true);
        user.setAccountNotExpired(true);
        user.setAccountNotLocked(true);
        user.setCredentialNotExpired(true);

        // validar roles existentes
        Set<Role> rolesValidados = new HashSet<>();
        if (user.getRolesList() != null && !user.getRolesList().isEmpty()) {
            for (Role r : user.getRolesList()) {
                roleService.findById(r.getId()).ifPresent(rolesValidados::add);
            }
        }
        user.setRolesList(rolesValidados);

        return userRepository.save(user);
    }

    @Override
    public void update(User userSec) {
        userRepository.save(userSec);
    }

    @Override
    public Optional<User> patchUser(Long id, PatchUserDTO patchDto) {
        return userRepository.findById(id).map(user -> {
            // Usamos el mapper para actualizar la entidad
            userMapper.patchUserFromDto(patchDto, user);
            return userRepository.save(user);
        });
    }

    @Override
    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public User activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setEnabled(true);
        return userRepository.save(user);
    }

    @Override
    public User desactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setEnabled(false);
        return userRepository.save(user);
    }
}
