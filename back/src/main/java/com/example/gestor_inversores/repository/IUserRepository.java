package com.example.gestor_inversores.repository;

import com.example.gestor_inversores.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IUserRepository extends JpaRepository<User, Long> {

    Optional<User> findUserEntityByUsername(String username);
    Optional<User> findByEmail(String email);
}

