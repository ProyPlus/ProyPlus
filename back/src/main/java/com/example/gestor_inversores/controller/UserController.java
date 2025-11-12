package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.RequestUserDTO;
import com.example.gestor_inversores.dto.RequestUserUpdateDTO;
import com.example.gestor_inversores.dto.ResponseUserDTO;
import com.example.gestor_inversores.mapper.UserMapper;
import com.example.gestor_inversores.model.User;
import com.example.gestor_inversores.repository.IUserRepository;
import com.example.gestor_inversores.service.user.IUserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private IUserService userService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private IUserRepository userRepository;

    // GET ALL
    @GetMapping
    public ResponseEntity<List<ResponseUserDTO>> getAllUsers() {
        List<User> users = userService.findAll();

        List<ResponseUserDTO> dtoList = users.stream()
                .map(userMapper::userToResponseUserDTO)
                .toList();

        return ResponseEntity.ok(dtoList);
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<ResponseUserDTO> getUserById(@PathVariable Long id) {
        return userService.findById(id)
                .map(userMapper::userToResponseUserDTO)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // CREATE
    @PostMapping
    public ResponseEntity<ResponseUserDTO> createUser(@Valid @RequestBody RequestUserDTO requestDto) {
        User user = userMapper.requestUserDTOToUser(requestDto);
        User savedUser = userService.save(user);
        ResponseUserDTO responseDto = userMapper.userToResponseUserDTO(savedUser);
        return ResponseEntity.ok(responseDto);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ResponseUserDTO> patchUser(
            @PathVariable Long id,
            @Valid @RequestBody RequestUserUpdateDTO patchDto) {

        Optional<User> updatedUser = userService.patchUser(id, patchDto);

        return updatedUser
                .map(user -> ResponseEntity.ok(userMapper.userToResponseUserDTO(user)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // DAR DE ALTA (lógica)
    @PatchMapping("/activate/{id}")
    public ResponseEntity<ResponseUserDTO> activateUser(@PathVariable Long id) {
        User updatedUser = userService.activateUser(id);
        return ResponseEntity.ok(userMapper.userToResponseUserDTO(updatedUser));
    }

    // DAR DE BAJA (lógica)
    @PatchMapping("/desactivate/{id}")
    public ResponseEntity<ResponseUserDTO> desactivateUser(@PathVariable Long id) {
        User updatedUser = userService.desactivateUser(id);
        return ResponseEntity.ok(userMapper.userToResponseUserDTO(updatedUser));
    }

    // ✅ Endpoint para validar si el username ya existe
    @GetMapping("/check-username/{username}")
    public ResponseEntity<Boolean> checkUsernameExists(@PathVariable String username) {
        return ResponseEntity.ok(userRepository.findUserEntityByUsername(username).isPresent());
    }

    // ✅ Endpoint para validar si el email ya existe
    @GetMapping("/check-email/{email}")
    public ResponseEntity<Boolean> checkEmailExists(@PathVariable String email) {
        return ResponseEntity.ok(userRepository.findByEmail(email).isPresent());
    }
}
