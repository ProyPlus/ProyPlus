package com.example.gestor_inversores.model.enums;

public enum ContractStatus {
    DRAFT,                      // Borrador del contrato, editable
    PARTIALLY_SIGNED,           // Acuerdo alcanzado, pendiente de firmas de ambas partes
    SIGNED,                     // Contrato firmado por ambos, inversión válida
    CANCELLED,                  // Contrato cancelado
    PENDING_REFUND,             // Estudiante ha iniciado el proceso de devolución
    REFUNDED,                   // Proyecto cancelado y monto devuelto al inversor
    REFUND_FAILED,              // La devolución ha fallado tras múltiples intentos
    CLOSED                      // Proyecto finalizado, contrato cerrado
}
