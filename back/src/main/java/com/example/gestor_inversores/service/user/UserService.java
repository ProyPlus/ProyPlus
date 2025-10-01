package com.example.gestor_inversores.service.user;

import com.example.gestor_inversores.dto.RequestUserUpdateDTO;
import com.example.gestor_inversores.exception.*;
import com.example.gestor_inversores.mapper.UserMapper;
import com.example.gestor_inversores.model.Role;
import com.example.gestor_inversores.model.User;
import com.example.gestor_inversores.repository.IUserRepository;
import com.example.gestor_inversores.service.role.IRoleService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.jpa.JpaSystemException;
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

    @Transactional
    @Override
    public User save(User user) {

        // Validar duplicados
        userRepository.findUserEntityByUsername(user.getUsername())
                .ifPresent(u -> { throw new UsernameAlreadyExistsException("El username ya existe."); });

        userRepository.findByEmail(user.getEmail())
                .ifPresent(u -> { throw new EmailAlreadyExistsException("El email ya existe."); });

        // Encriptar password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Setear valores por defecto
        user.setEnabled(true);
        user.setAccountNotExpired(true);
        user.setAccountNotLocked(true);
        user.setCredentialNotExpired(true);

        // Validar roles existentes
        Set<Role> rolesValidados = new HashSet<>();
        if (user.getRolesList() != null && !user.getRolesList().isEmpty()) {
            for (Role r : user.getRolesList()) {
                roleService.findById(r.getId()).ifPresent(rolesValidados::add);
            }
        }
        user.setRolesList(rolesValidados);

        try {
            return userRepository.save(user);
        } catch (DataIntegrityViolationException | JpaSystemException ex) {
            throw new CreateException("No se pudo guardar el usuario");
        }
    }

    @Transactional
    @Override
    public void update(User user) {
        try {
            userRepository.save(user);
        } catch (DataIntegrityViolationException | JpaSystemException ex) {
            throw new UpdateException("No se pudo actualizar el usuario");
        }
    }

    @Transactional
    @Override
    public Optional<User> patchUser(Long id, RequestUserUpdateDTO patchDto) {
        return userRepository.findById(id).map(user -> {
            userMapper.patchUserFromDto(patchDto, user);
            try {
                return userRepository.save(user); // JPA detecta que es update por tener id
            } catch (DataIntegrityViolationException | JpaSystemException ex) {
                throw new UpdateException("No se pudo actualizar el usuario");
            }
        });
    }

    @Transactional
    @Override
    public void deleteById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado"));
        try {
            userRepository.deleteById(id);
        } catch (DataIntegrityViolationException | JpaSystemException ex) {
            throw new DeleteException("No se pudo eliminar el usuario");
        }
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Transactional
    @Override
    public User activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado"));
        user.setEnabled(true);

        try {
            return userRepository.save(user);
        } catch (DataIntegrityViolationException | JpaSystemException ex) {
            throw new UpdateException("No se pudo activar el usuario");
        }
    }

    @Transactional
    @Override
    public User desactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado"));
        user.setEnabled(false);

        try {
            return userRepository.save(user);
        } catch (DataIntegrityViolationException | JpaSystemException ex) {
            throw new UpdateException("No se pudo desactivar el usuario");
        }
    }
}
