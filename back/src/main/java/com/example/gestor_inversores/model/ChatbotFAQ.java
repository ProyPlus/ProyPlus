package com.example.gestor_inversores.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "chatbotFAQs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotFAQ {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idChatbotFAQ;
    private String question;
    private String answer;
}
