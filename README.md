# SaaS de Agendación de Citas Inteligente

Este es un sistema completo de agendación de citas diseñado para empresas, con un motor de sugerencias basado en disponibilidad y popularidad.

## 🚀 Tecnologías Utilizadas

- **Backend:** Node.js, Express, MongoDB, JWT, Bcrypt
- **Frontend:** HTML5, CSS3 (Modern UI), JavaScript (Vanilla)
- **Base de Datos:** MongoDB (Mongoose)

## 📁 Estructura del Proyecto

- `/backend`: Servidor Express y configuración de seguridad.
- `/frontend`: Interfaz de usuario, estilos y lógica de cliente.
- `/models`: Esquemas de base de datos (Usuarios, Empresas, Citas).
- `/routes`: Definición de endpoints API REST.
- `/controllers`: Lógica de negocio y manejo de peticiones.
- `/backend/utils`: Motor de sugerencias inteligentes (IA simulada).

## 🛠️ Instalación y Ejecución

1. **Requisitos previos:**
   - Node.js instalado.
   - MongoDB corriendo localmente (o cambiar `MONGODB_URI` en `.env`).

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   El archivo `.env` ya ha sido creado con valores por defecto. Puedes editarlos si es necesario.

4. **Iniciar el servidor:**
   ```bash
   npm start
   ```
   El sistema estará disponible en `http://localhost:5000`.

## 🔑 Credenciales de Prueba (Demo)

- **Admin (Empresa):** `admin@demo.com` / `demo123`
- **Cliente:** Puedes registrarte como cliente desde la pantalla principal.

## 🌟 Funcionalidad Innovadora: Smart Scheduler

El sistema incluye un motor de sugerencias que no solo busca espacios vacíos, sino que:
1. **Analiza popularidad:** Sugiere horarios en franjas de alta demanda (media mañana/primera tarde).
2. **Optimiza la agenda:** Prioriza llenar huecos que maximicen la eficiencia de la empresa.
3. **Validación en tiempo real:** Cruza el horario de la empresa con citas existentes.

## 📡 Endpoints Principales (API REST)

### Autenticación
- `POST /api/auth/register`: Registro de nuevos usuarios.
- `POST /api/auth/login`: Inicio de sesión y generación de JWT.

### Empresas
- `GET /api/companies`: Listar todas las empresas.
- `GET /api/companies/me`: Obtener perfil de la propia empresa (Admin).
- `PUT /api/companies/update`: Actualizar configuración y horarios (Admin).

### Citas
- `POST /api/appointments`: Agendar una nueva cita.
- `GET /api/appointments`: Ver citas del usuario logueado.
- `GET /api/appointments/suggest`: Obtener sugerencias inteligentes de horarios.
- `PUT /api/appointments/:id/cancel`: Cancelar una cita.
