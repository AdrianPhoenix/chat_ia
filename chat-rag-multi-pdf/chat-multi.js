const API_KEY = 'mnYOJCCBzvjfXEMvrzpXxEyXJDMLiOU5mBwnEvjc';
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const pdfInput = document.getElementById('pdfInput');
const fileList = document.getElementById('fileList');
const clearFiles = document.getElementById('clearFiles');

let pdfDocuments = new Map(); // fileName -> {content, status}

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

function createFileItem(fileName, fileId) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item processing';
    fileItem.id = `file-${fileId}`;
    
    fileItem.innerHTML = `
        <span class="file-name">📄 ${fileName} (procesando...)</span>
        <button class="remove-file" onclick="removeFile('${fileId}', '${fileName}')">✕</button>
    `;
    
    return fileItem;
}

function updateFileStatus(fileId, fileName, status) {
    const fileItem = document.getElementById(`file-${fileId}`);
    if (!fileItem) return;
    
    const fileNameSpan = fileItem.querySelector('.file-name');
    
    switch (status) {
        case 'loaded':
            fileItem.className = 'file-item loaded';
            fileNameSpan.textContent = `✅ ${fileName}`;
            break;
        case 'error':
            fileItem.className = 'file-item error';
            fileNameSpan.textContent = `❌ ${fileName} (error)`;
            break;
    }
}

function removeFile(fileId, fileName) {
    pdfDocuments.delete(fileName);
    document.getElementById(`file-${fileId}`).remove();
    
    if (pdfDocuments.size === 0) {
        messageInput.disabled = true;
        sendButton.disabled = true;
        messageInput.placeholder = 'Sube PDFs primero...';
        clearFiles.style.display = 'none';
        document.querySelector('.help-text').textContent = 'Sube uno o más PDFs para empezar';
    }
    
    addMessage(`🗑️ Archivo "${fileName}" eliminado.`, 'system');
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

function createContext(question, allDocuments) {
    const questionWords = question.toLowerCase().split(' ');
    let allRelevantSentences = [];
    
    // Buscar en todos los documentos
    for (const [fileName, doc] of allDocuments) {
        if (doc.status !== 'loaded') continue;
        
        const sentences = doc.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
        
        const relevantSentences = sentences
            .map(sentence => {
                const score = questionWords.reduce((acc, word) => {
                    return acc + (sentence.toLowerCase().includes(word) ? 1 : 0);
                }, 0);
                return { sentence: sentence.trim(), score, source: fileName };
            })
            .filter(item => item.score > 0);
        
        allRelevantSentences.push(...relevantSentences);
    }
    
    // Ordenar por relevancia y tomar las mejores
    const bestSentences = allRelevantSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => `[${item.source}]: ${item.sentence}`)
        .join('\n\n');
    
    return bestSentences;
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || pdfDocuments.size === 0) return;

    addMessage(message, 'user');
    messageInput.value = '';
    sendButton.disabled = true;

    try {
        const context = createContext(message, pdfDocuments);
        const loadedDocs = Array.from(pdfDocuments.keys()).filter(name => 
            pdfDocuments.get(name).status === 'loaded'
        );
        
        const prompt = `Basándote en el contenido de estos documentos: ${loadedDocs.join(', ')}

Contexto relevante:
${context}

Pregunta: ${message}

Responde basándote únicamente en la información proporcionada. Si mencionas información específica, indica de qué documento proviene.`;

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
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    for (const file of files) {
        const fileId = Date.now() + Math.random();
        const fileItem = createFileItem(file.name, fileId);
        fileList.appendChild(fileItem);
        
        // Inicializar en el Map
        pdfDocuments.set(file.name, { content: '', status: 'processing' });
        
        // Procesar archivo
        const text = await extractTextFromPDF(file);
        
        if (text) {
            pdfDocuments.set(file.name, { content: text, status: 'loaded' });
            updateFileStatus(fileId, file.name, 'loaded');
        } else {
            pdfDocuments.set(file.name, { content: '', status: 'error' });
            updateFileStatus(fileId, file.name, 'error');
        }
    }
    
    // Habilitar chat si hay documentos cargados
    const loadedCount = Array.from(pdfDocuments.values()).filter(doc => doc.status === 'loaded').length;
    if (loadedCount > 0) {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.placeholder = 'Pregunta sobre los PDFs...';
        clearFiles.style.display = 'inline-block';
        document.querySelector('.help-text').textContent = 'Presiona Enter para enviar';
        
        addMessage(`✅ ${loadedCount} PDF(s) cargado(s). Puedes hacer preguntas sobre todo el contenido.`, 'system');
        messageInput.focus();
    }
    
    // Limpiar input
    pdfInput.value = '';
});

clearFiles.addEventListener('click', () => {
    pdfDocuments.clear();
    fileList.innerHTML = '';
    messageInput.disabled = true;
    sendButton.disabled = true;
    messageInput.placeholder = 'Sube PDFs primero...';
    clearFiles.style.display = 'none';
    document.querySelector('.help-text').textContent = 'Sube uno o más PDFs para empezar';
    
    addMessage('🗑️ Todos los archivos han sido eliminados.', 'system');
});

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});

// Mensaje inicial
addMessage('¡Hola! Sube uno o más PDFs para empezar a chatear sobre su contenido.', 'system');
