package com.example.gestor_inversores.model.enums;

public enum ContractStatus {
    PENDING_STUDENT_SIGNATURE,  // Creado por el inversor, pendiente firma del estudiante
    SIGNED,                      // Contrato firmado por ambos, inversión válida
    CANCELLED,                   // Contrato cancelado antes de firma o por otra razón
    REFUNDED,                    // Proyecto cancelado y monto devuelto al inversor
    CLOSED                       // Proyecto finalizado, contrato cerrado
}
