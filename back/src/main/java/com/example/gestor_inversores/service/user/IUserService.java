package com.example.gestor_inversores.service.user;

import com.example.gestor_inversores.dto.RequestUserUpdateDTO;
import com.example.gestor_inversores.model.User;

import java.util.List;
import java.util.Optional;

public interface IUserService {

    List<User> findAll();

    Optional<User> findById(Long id);

    User save(User userSec);

    void update(User userSec);

    Optional<User> patchUser(Long id, RequestUserUpdateDTO patchDto);

    void deleteById(Long id);

    Optional<User> findByEmail(String email);

    User activateUser(Long id);

    User desactivateUser(Long id);

}
