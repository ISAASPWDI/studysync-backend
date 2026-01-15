# StudySync 🎓

Academic matchmaking application inspired by Tinder, designed to connect students based on their interests, skills, and academic goals. Built with modern technologies including Flutter, Nest.js, MongoDB, and Machine Learning.

## 📋 Descripción del Proyecto

StudySync es una plataforma innovadora que facilita conexiones académicas significativas entre estudiantes. Utilizando un algoritmo de Machine Learning (KNN), la aplicación sugiere perfiles compatibles basándose en habilidades, intereses, ubicación y objetivos académicos.

### Flujo de la Aplicación

1. **Login**: Autenticación segura con Google, GitHub o JWT
2. **Splash Screen**: Recopilación inicial de información del usuario
   - Habilidades
   - Edad
   - Ubicación
   - Objetivos (colaborar, aprender, investigación, etc.)
3. **Swipe**: Sistema de descubrimiento de perfiles compatibles
   - Algoritmo KNN para matching inteligente
   - Actualización dinámica basada en preferencias
4. **Matches Académicos**: Gestión de conexiones
   - ✅ Confirmadas (con estados: en línea, sin leer)
   - ⏳ Pendientes (aceptar/rechazar)
   - 📤 Enviados (pendiente, rechazado, aceptado)
5. **Conversaciones**: Chat en tiempo real con matches confirmados
   - Búsqueda rápida de conversaciones
6. **Perfil**: CRUD completo de información personal
   - Edición de habilidades
   - Actualización automática del modelo ML

## 🛠️ Stack Tecnológico

### Frontend
- **Flutter** - Framework multiplataforma

### Backend
- **Nest.js** - Framework Node.js
- **TypeScript** - Tipado estático

### Base de Datos
- **MongoDB** - Base de datos NoSQL

### Machine Learning
- **Python** - Lenguaje para ML
- **FastAPI** - API para modelo ML
- **KNN (K-Nearest Neighbors)** - Algoritmo de clustering supervisado

### Infraestructura & Autenticación
- **Docker** - Containerización
- **JWT** - Tokens de autenticación
- **Google OAuth** - Autenticación con Google
- **GitHub OAuth** - Autenticación con GitHub

## 📁 Estructura del Proyecto

```
studysync/
├── src/
│   ├── auth/              # Módulo de autenticación
│   ├── users/             # Gestión de usuarios
│   │   ├── application/   # Casos de uso
│   │   ├── domain/        # Entidades y lógica de negocio
│   │   └── infrastructure/# Repositorios y adaptadores
│   ├── swipe/             # Sistema de matching
│   ├── matches/           # Gestión de matches
│   ├── messages/          # Sistema de mensajería
│   ├── ml-client/         # Cliente para servicio ML
│   └── shared/            # Recursos compartidos
├── dist/                  # Build de producción
├── test/                  # Tests
├── .env.example           # Variables de entorno (ejemplo)
└── package.json           # Dependencias
```

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js >= 18.x
- MongoDB >= 6.x
- Python >= 3.9 (para servicio ML)
- Docker (opcional)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd studysync
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

4. **Configurar variables necesarias en `.env`**
```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/studysync

# JWT
JWT_SECRET=your-secret-key

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# ML Service
ML_SERVICE_URL=http://localhost:8000
```

5. **Iniciar el servidor de desarrollo**
```bash
npm run start:dev
```

## 🤖 Servicio de Machine Learning

El modelo KNN se ejecuta como un servicio independiente en FastAPI:

```bash
cd ml-service
pip install -r requirements.txt
python main.py
```

El modelo se entrena y actualiza automáticamente con:
- Preferencias del usuario
- Historial de matches
- Interacciones en la plataforma

## 📊 Características Principales

### Sistema de Matching Inteligente
- ✨ Algoritmo KNN para sugerencias personalizadas
- 🔄 Actualización en tiempo real del perfil
- 🎯 Filtrado por múltiples criterios

### Gestión de Matches
- 📊 Dashboard con estados de matches
- 🔔 Notificaciones en tiempo real
- ✅ Sistema de aceptación/rechazo

### Mensajería
- 💬 Chat en tiempo real
- 🔍 Búsqueda rápida de conversaciones
- 📱 Notificaciones push

### Perfil de Usuario
- ✏️ CRUD completo
- 🏷️ Gestión de habilidades
- 📸 Avatar personalizable

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🐳 Docker

```bash
# Construir imagen
docker build -t studysync .

# Ejecutar contenedor
docker run -p 3000:3000 studysync
```

## 📝 Scripts Disponibles

```bash
npm run start          # Iniciar en producción
npm run start:dev      # Iniciar en desarrollo
npm run start:debug    # Iniciar con debugger
npm run build          # Compilar proyecto
npm run lint           # Ejecutar linter
npm run format         # Formatear código
```

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autores

- Stevens Aliaga Arauco - [GitHub](https://github.com/ISAASPWDI)

## 🙏 Agradecimientos

- Inspirado en el modelo de Tinder
- Comunidad de Flutter y Nest.js
- Bibliotecas de Machine Learning de Python

---

**¿Tienes preguntas?** Abre un issue en el repositorio.
