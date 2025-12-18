const API_KEY = 'mnYOJCCBzvjfXEMvrzpXxEyXJDMLiOU5mBwnEvjc';
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + (isUser ? 'user' : 'ai');
    
    if (isUser) {
        messageDiv.textContent = text;
    } else {
        // Renderizar Markdown para mensajes de IA
        const htmlContent = marked.parse(text);
        const cleanContent = DOMPurify.sanitize(htmlContent);
        messageDiv.innerHTML = `<div class="markdown-content">${cleanContent}</div>`;
    }
    
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
        const response = await fetch('https://api.cohere.com/v1/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + API_KEY
            },
            body: JSON.stringify({
                model: 'command-a-03-2025',
                message: message
            })
        });

        const data = await response.json();
        
        if (data.text) {
            addMessage(data.text, false);
        } else if (data.message) {
            addMessage('Error: ' + data.message, false);
        } else {
            addMessage('Error: Respuesta inesperada de la API', false);
        }
    } catch (error) {
        addMessage('Error: ' + error.message, false);
    }

    sendButton.disabled = false;
    messageInput.focus();
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Mensaje de bienvenida
addMessage('¡Hola! Escribe algo para empezar a chatear.', false);
