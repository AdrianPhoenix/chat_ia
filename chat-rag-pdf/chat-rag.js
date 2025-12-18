const API_KEY = 'mnYOJCCBzvjfXEMvrzpXxEyXJDMLiOU5mBwnEvjc';
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const pdfInput = document.getElementById('pdfInput');
const fileName = document.getElementById('fileName');

let pdfContent = '';

// Configurar PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function addMessage(text, type = 'ai') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    if (type === 'user') {
        messageDiv.textContent = text;
    } else {
        const htmlContent = marked.parse(text);
        const cleanContent = DOMPurify.sanitize(htmlContent);
        messageDiv.innerHTML = `<div class="markdown-content">${cleanContent}</div>`;
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function extractTextFromPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        
        return fullText;
    } catch (error) {
        console.error('Error extrayendo texto del PDF:', error);
        return null;
    }
}

function createContext(question, content) {
    // Buscar las partes más relevantes del contenido
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const questionWords = question.toLowerCase().split(' ');
    
    // Encontrar oraciones relevantes
    const relevantSentences = sentences
        .map(sentence => {
            const score = questionWords.reduce((acc, word) => {
                return acc + (sentence.toLowerCase().includes(word) ? 1 : 0);
            }, 0);
            return { sentence: sentence.trim(), score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.sentence);
    
    return relevantSentences.join('. ');
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !pdfContent) return;

    addMessage(message, 'user');
    messageInput.value = '';
    sendButton.disabled = true;

    try {
        // Crear contexto relevante del PDF
        const context = createContext(message, pdfContent);
        
        // Crear prompt con contexto
        const prompt = `Basándote en el siguiente contexto del documento:

"${context}"

Responde a la siguiente pregunta: ${message}

Si la información no está en el contexto proporcionado, indica que no tienes esa información en el documento.`;

        const response = await fetch('https://api.cohere.com/v1/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + API_KEY
            },
            body: JSON.stringify({
                model: 'command-a-03-2025',
                message: prompt
            })
        });

        const data = await response.json();
        
        if (data.text) {
            addMessage(data.text, 'ai');
        } else {
            addMessage('Error: No se pudo obtener respuesta', 'ai');
        }
    } catch (error) {
        addMessage('Error: ' + error.message, 'ai');
    }

    sendButton.disabled = false;
    messageInput.focus();
}

// Event Listeners
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    fileName.textContent = `Procesando: ${file.name}...`;
    addMessage('📄 Procesando PDF...', 'system');
    
    const text = await extractTextFromPDF(file);
    
    if (text) {
        pdfContent = text;
        fileName.textContent = `✅ ${file.name} cargado`;
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.placeholder = 'Pregunta sobre el PDF...';
        document.querySelector('.help-text').textContent = 'Presiona Enter para enviar';
        
        addMessage(`✅ PDF "${file.name}" cargado correctamente. Ahora puedes hacer preguntas sobre su contenido.`, 'system');
        messageInput.focus();
    } else {
        fileName.textContent = '❌ Error al procesar PDF';
        addMessage('❌ Error al procesar el PDF. Intenta con otro archivo.', 'system');
    }
});

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});

// Mensaje inicial
addMessage('¡Hola! Sube un PDF para empezar a chatear sobre su contenido.', 'system');
