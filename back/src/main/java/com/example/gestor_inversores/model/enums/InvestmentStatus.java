package com.example.gestor_inversores.model.enums;

public enum InvestmentStatus {

    IN_PROGRESS,      // La inversión ha sido creada, pendiente de transferencia
    PENDING_CONFIRMATION, // El inversor ha confirmado que envió el dinero, pendiente de recepción del estudiante
    RECEIVED,         // El estudiante ha confirmado la recepción del dinero
    NOT_RECEIVED,     // El estudiante ha reportado que no recibió el dinero

    CANCELLED,        // La inversión ha sido cancelada

    // Flujo de Devolución
    PENDING_REFUND,   // El estudiante ha iniciado el proceso de devolución
    PENDING_RETURN,   // El estudiante ha confirmado el envío de la devolución, pendiente de confirmación del inversor
    REFUND_NOT_RECEIVED, // El inversor ha reportado que no recibió la devolución
    RETURNED,         // El inversor ha confirmado la recepción de la devolución
    REFUND_FAILED,    // La devolución ha fallado tras múltiples intentos

    COMPLETED         // La inversión completó su ciclo y la ganancia fue pagada
}
