package com.example.gestor_inversores.service.auth;

import com.example.gestor_inversores.dto.AuthLoginRequestDTO;
import com.example.gestor_inversores.dto.AuthLoginResponseDTO;
import com.example.gestor_inversores.model.User;
import com.example.gestor_inversores.repository.IUserRepository;
import com.example.gestor_inversores.utils.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserDetailsServiceImp implements UserDetailsService {

    @Autowired
    private IUserRepository userRepo;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        User userSec = userRepo.findUserEntityByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("El usuario " + username + "no fue encontrado"));

        List<SimpleGrantedAuthority> authorityList = new ArrayList<>();

        userSec.getRolesList()
                .forEach(role -> authorityList.add(new SimpleGrantedAuthority("ROLE_".concat(role.getRole()))));

        userSec.getRolesList().stream()
                .flatMap(role -> role.getPermissionsList().stream())
                .forEach(permission -> authorityList.add(new SimpleGrantedAuthority(permission.getPermissionName())));

        return new org.springframework.security.core.userdetails.User(
                userSec.getUsername(),
                userSec.getPassword(),
                Boolean.TRUE.equals(userSec.getEnabled()),
                Boolean.TRUE.equals(userSec.getAccountNotExpired()),
                Boolean.TRUE.equals(userSec.getCredentialNotExpired()),
                Boolean.TRUE.equals(userSec.getAccountNotLocked()),
                authorityList
        );

    }

    public AuthLoginResponseDTO loginUser(@Valid AuthLoginRequestDTO authLoginRequestDTO) {

        String username = authLoginRequestDTO.username();
        String password = authLoginRequestDTO.password();

        // Autenticar
        Authentication authentication = this.authenticate(username, password);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Generar JWT
        String accessToken = jwtUtils.createToken(authentication);

        // Traer el usuario de la DB para obtener su ID
        User user = userRepo.findUserEntityByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("El usuario " + username + " no fue encontrado"));

        // Retornar DTO con ID incluido
        return new AuthLoginResponseDTO(user.getId(), username, "Login successful", accessToken, true);
    }


    public Authentication authenticate(String username, String password) {

        UserDetails userDetails = this.loadUserByUsername(username);
        if (userDetails == null) {
            throw new BadCredentialsException("Invalid username or password");
        }
        if (!passwordEncoder.matches(password, userDetails.getPassword())) {
            throw new BadCredentialsException("Invalid username or password");
        }
        return new UsernamePasswordAuthenticationToken(username, userDetails.getPassword(), userDetails.getAuthorities());

    }
}

