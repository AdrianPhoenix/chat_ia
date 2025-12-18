const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typing');

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
        // Renderizar Markdown para mensajes de IA
        const htmlContent = marked.parse(content);
        const cleanContent = DOMPurify.sanitize(htmlContent);
        messageContent.innerHTML = `<div class="markdown-content">${cleanContent}</div>`;
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    chatContainer.appendChild(messageDiv);
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTyping() {
    typingIndicator.classList.remove('hidden');
}

function hideTyping() {
    typingIndicator.classList.add('hidden');
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    addMessage(message, true);
    messageInput.value = '';
    sendButton.disabled = true;
    showTyping();
    
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
    
    hideTyping();
    sendButton.disabled = false;
    messageInput.focus();
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
