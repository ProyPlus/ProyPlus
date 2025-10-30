# Create a README for Angular frontend setup
readme_content = r"""# Frontend (Angular) — Guía de instalación y uso

Este proyecto usa **Angular 20** y **Node.js 20 LTS**. El código del front está en la carpeta `front/`.

> Si solo querés correrlo: seguí **Instalación rápida** y **Modo desarrollo**.  
> Si recién clonaste y te falló el push por archivos grandes, revisá **Solución a errores comunes** al final.

---

## Requisitos

- **Git** 2.40+
- **Node.js 20 LTS** (recomendado)  
  - Sugerido usar un manejador de versiones:
    - Linux/macOS: `nvm`  
      ```bash
      nvm install 20
      nvm use 20
      ```
    - Windows: `nvm-windows`
      ```powershell
      nvm install 20
      nvm use 20
      ```
- **Angular CLI** 20.x
  ```bash
  npm i -g @angular/cli@20





----------------------------PARA QUE UN ESTUDIANTE PUEDA MODIFICAR LOS TERMINOS DEL CONTRATO

api/contracts/update-by-student/62

{
    "studentId": 9,
    "textTitle": "RE: PRUEBA DE NUEVO FLUJO DE CONTRATOS 2",
    "description": "<h1>Términos y Condiciones Revisados</h1><p>He revisado la propuesta y estoy de acuerdo con la mayoría de los puntos, pero sugiero los siguientes ajustes en los retornos.</p>",
    "amount": 16000.00,
    "currency": "USD",
    "profit1Year": 7,
    "profit2Years": 12,
    "profit3Years": 15
}

Lucas Beron
9:31 p.m.
PARA QUE UN INVERSOR PUEDA MODIFICAR LOS TERMINOS DEL CONTRATO

api/contracts/update-by-investor/62

{
    "investorId": 22,
    "textTitle": "OFERTA REVISADA: PRUEBA DE NUEVO FLUJO DE CONTRATOS 2",
    "description": "<h1>Términos y Condiciones Actualizados por Inversor</h1><p>Hemos revisado la propuesta del estudiante y ajustado el monto de inversión y los porcentajes de ganancia para hacerla más atractiva.</p>",
    "amount": 18000.00,
    "currency": "USD",
    "profit1Year": 5,
    "profit2Years": 9,
    "profit3Years": 12
}


PARA QUE UN INVERSOR PUEDA BLOQUEAR LOS TERMINOS DEL CONTRATO (EL CONTRATO PASA DE DRAFT A PARTIALLY_SIGNED

api/contracts/agree-by-investor/69

{
    "investorId": 22
}


PARA QUE UN ESTUDIANTE PUEDA BLOQUEAR LOS TERMINOS DEL CONTRATO (EL CONTRATO PASA A DRAFT A PARTIALLY_SIGNED)

api/contracts/agree-by-student/67

{
  "studentId": 9
}