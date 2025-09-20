package com.example.gestor_inversores.repository;

import com.example.gestor_inversores.model.PasswordResetToken;
import com.example.gestor_inversores.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IPasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    PasswordResetToken findByToken(String token);
    void deleteByUser(User user);
}
