package com.example.gestor_inversores.service.auth;

import com.example.gestor_inversores.model.PasswordResetToken;
import com.example.gestor_inversores.model.User;
import com.example.gestor_inversores.repository.IPasswordResetTokenRepository;
import com.example.gestor_inversores.repository.IUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService implements IPasswordResetService {

    @Autowired
    private IUserRepository userRepository;
    @Autowired
    private IPasswordResetTokenRepository tokenRepository;
    @Autowired
    private JavaMailSender mailSender;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public String createPasswordResetToken(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (!userOptional.isPresent()) {
            return "No se encontró un usuario con ese correo.";
        }
        User user = userOptional.get();

        tokenRepository.deleteByUser(user);

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(15));
        tokenRepository.save(resetToken);

        sendPasswordResetEmail(user, token);

        return "Instrucciones para restablecer la contraseña enviadas al correo.";
    }

    @Override
    @Transactional
    public String resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token);

        if (resetToken == null) {
            return "Token inválido.";
        }

        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            return "El token ha expirado. Por favor, solicita uno nuevo.";
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        tokenRepository.delete(resetToken);

        return "Contraseña restablecida exitosamente.";
    }

    private void sendPasswordResetEmail(User user, String token) {
        SimpleMailMessage email = new SimpleMailMessage();
        email.setTo(user.getEmail());
        email.setSubject("Restablecer Contraseña");
        email.setText("Para restablecer tu contraseña, haz clic en el siguiente enlace: \n"
                + "http://localhost:8080/reset-password?token=" + token); // Reemplaza con la URL de tu frontend
        mailSender.send(email);
    }
}
