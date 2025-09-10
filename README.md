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
