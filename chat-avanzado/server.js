const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ruta para servir el HTML
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
