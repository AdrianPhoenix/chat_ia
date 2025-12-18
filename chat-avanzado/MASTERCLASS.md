# 🚀 Masterclass: Chat con IA usando Node.js y Tailwind CSS

## 📋 Requisitos Previos

- Node.js instalado (v16 o superior)
- Editor de código (VS Code recomendado)
- Navegador web moderno
- Cuenta en Cohere (gratuita)

## 🎯 Objetivo

Crear un chat con inteligencia artificial desde cero usando tecnologías modernas.

---

## 📁 Paso 1: Estructura del Proyecto

```bash
mkdir chat-ia-masterclass
cd chat-ia-masterclass
```

Crear la siguiente estructura:
```
chat-ia-masterclass/
├── server.js
├── package.json
├── .env
├── README.md
└── public/
    ├── index.html
    └── script.js
```

---

## 📦 Paso 2: Configurar package.json

```json
{
  "name": "chat-ia-masterclass",
  "version": "1.0.0",
  "description": "Chat con IA - Masterclass",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

**Instalar dependencias:**
```bash
npm install
```

---

## 🔑 Paso 3: Obtener API Key de Cohere

1. Ir a https://cohere.ai
2. Crear cuenta gratuita
3. Ir a "API Keys"
4. Generar nueva key
5. Copiar la key (empieza con letras y números)

---

## 🌍 Paso 4: Variables de Entorno (.env)

```env
COHERE_API_KEY=tu-api-key-aqui
PORT=3000
```

⚠️ **Importante**: Nunca subir este archivo a Git

---

## 🖥️ Paso 5: Servidor Backend (server.js)

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        const response = await fetch('https://api.cohere.com/v1/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.COHERE_API_KEY}`
            },
            body: JSON.stringify({
                model: 'command-a-03-2025',
                message: message
            })
        });

        const data = await response.json();
        
        if (data.text) {
            res.json({ success: true, response: data.text });
        } else {
            res.json({ success: false, error: data.message || 'Error desconocido' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
```

---

## 🎨 Paso 6: Frontend HTML (public/index.html)

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat IA - Masterclass</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js"></script>
    <style>
        .markdown-content h1 { @apply text-xl font-bold mb-2 text-gray-900; }
        .markdown-content h2 { @apply text-lg font-bold mb-2 text-gray-800; }
        .markdown-content h3 { @apply text-base font-bold mb-1 text-gray-700; }
        .markdown-content p { @apply mb-2 leading-relaxed; }
        .markdown-content code { @apply bg-gray-200 px-1 py-0.5 rounded text-sm font-mono; }
        .markdown-content pre { @apply bg-gray-800 text-green-400 p-3 rounded-lg mb-2 overflow-x-auto; }
        .markdown-content pre code { @apply bg-transparent px-0 py-0; }
        .markdown-content ul { @apply list-disc list-inside mb-2 space-y-1; }
        .markdown-content ol { @apply list-decimal list-inside mb-2 space-y-1; }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <div class="container mx-auto max-w-4xl p-4">
        <!-- Header -->
        <div class="bg-white rounded-t-2xl shadow-lg p-6 border-b">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold">🤖</span>
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Chat IA - Masterclass</h1>
                    <p class="text-gray-500 text-sm">Powered by Cohere</p>
                </div>
            </div>
        </div>

        <!-- Chat Container -->
        <div id="chatContainer" class="bg-white h-96 overflow-y-auto p-6 space-y-4">
            <!-- Los mensajes aparecerán aquí -->
        </div>

        <!-- Input Area -->
        <div class="bg-white rounded-b-2xl shadow-lg p-6">
            <div class="flex space-x-4">
                <input 
                    type="text" 
                    id="messageInput" 
                    placeholder="Escribe tu mensaje aquí..." 
                    class="flex-1 border border-gray-300 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autofocus
                >
                <button 
                    id="sendButton" 
                    class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                    Enviar
                </button>
            </div>
            <div class="mt-3 text-sm text-gray-500">
                <span>Presiona Enter para enviar</span>
            </div>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
```

---

## ⚡ Paso 7: JavaScript Frontend (public/script.js)

```javascript
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start space-x-3';
    
    if (isUser) {
        messageDiv.className += ' flex-row-reverse space-x-reverse';
    }
    
    const avatar = document.createElement('div');
    avatar.className = `w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
            ? 'bg-gradient-to-r from-green-500 to-blue-500' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600'
    }`;
    avatar.innerHTML = `<span class="text-white text-sm">${isUser ? '👤' : '🤖'}</span>`;
    
    const messageContent = document.createElement('div');
    messageContent.className = `rounded-2xl p-4 max-w-xs lg:max-w-2xl ${
        isUser 
            ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-tr-sm' 
            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
    }`;
    
    if (isUser) {
        messageContent.innerHTML = `<p>${content}</p>`;
    } else {
        // Renderizar Markdown para IA
        const htmlContent = marked.parse(content);
        const cleanContent = DOMPurify.sanitize(htmlContent);
        messageContent.innerHTML = `<div class="markdown-content">${cleanContent}</div>`;
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    chatContainer.appendChild(messageDiv);
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    addMessage(message, true);
    messageInput.value = '';
    sendButton.disabled = true;
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        if (data.success) {
            addMessage(data.response);
        } else {
            addMessage(`Error: ${data.error}`);
        }
    } catch (error) {
        addMessage(`Error de conexión: ${error.message}`);
    }
    
    sendButton.disabled = false;
    messageInput.focus();
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Mensaje de bienvenida
addMessage('¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte?');
```

---

## 🚀 Paso 8: Ejecutar el Proyecto

```bash
# Desarrollo (con auto-reload)
npm run dev

# O producción
npm start
```

Abrir: http://localhost:3000

---

## 🎯 Conceptos Clave Explicados

### Backend (Node.js + Express)
- **Express**: Framework web minimalista
- **CORS**: Permite peticiones desde el frontend
- **dotenv**: Maneja variables de entorno seguras
- **API REST**: Endpoint `/api/chat` para comunicación

### Frontend (HTML + Tailwind + JavaScript)
- **Tailwind CSS**: Framework CSS utility-first
- **Fetch API**: Comunicación asíncrona con backend
- **DOM Manipulation**: Creación dinámica de elementos
- **Markdown Rendering**: Formato rico en respuestas

### Inteligencia Artificial
- **Cohere API**: Servicio de IA conversacional
- **Modelo command-a-03-2025**: Último modelo disponible
- **API Key**: Autenticación segura

---

## 🔧 Mejoras Posibles

1. **Historial de chat** (localStorage)
2. **Diferentes temas** (modo oscuro)
3. **Autenticación de usuarios**
4. **Base de datos** (MongoDB/PostgreSQL)
5. **WebSockets** (chat en tiempo real)
6. **Streaming de respuestas**
7. **Subida de archivos**

---

## 🛡️ Seguridad

- ✅ Variables de entorno para API keys
- ✅ Sanitización HTML con DOMPurify
- ✅ CORS configurado
- ✅ Validación de entrada básica

---

## 📚 Recursos Adicionales

- [Documentación Cohere](https://docs.cohere.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express.js](https://expressjs.com/)
- [Marked.js](https://marked.js.org/)

---

## 🎉 ¡Proyecto Completado!

Has creado un chat con IA completamente funcional usando tecnologías modernas. El proyecto incluye:

- ✅ Backend robusto con Node.js
- ✅ Frontend responsive con Tailwind
- ✅ Integración con IA de Cohere
- ✅ Renderizado de Markdown
- ✅ Diseño profesional
- ✅ Código limpio y escalable

**¡Perfecto para tu masterclass!** 🚀
