require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// --- CONFIGURAÇÃO ---
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI; // Pega o link do Render ou arquivo .env

// Conectar ao MongoDB
if (!mongoURI) {
    console.error("ERRO: A variável MONGO_URI não está definida.");
} else {
    mongoose.connect(mongoURI)
        .then(() => console.log('✅ MongoDB Conectado com Sucesso!'))
        .catch(err => console.error('❌ Erro ao conectar no MongoDB:', err));
}

// Middleware para ler JSON
app.use(express.json({ limit: '10mb' })); // Limite aumentado para aceitar assinaturas Base64
app.use(express.static(path.join(__dirname, 'public')));

// --- MODELO DO BANCO DE DADOS (SCHEMA) ---
const ReciboSchema = new mongoose.Schema({
    nome: String,
    cpf: String,
    rg: String,
    endereco: String,
    modelo: String,
    imei: String,
    valor: String,
    estado: String,
    assinatura: String, // Salva a imagem em Base64
    dataCriacao: { type: Date, default: Date.now }, // Data real do sistema
    dataFormatada: String, // Data para exibição (DD/MM/AAAA)
    horaFormatada: String  // Hora para exibição
});

const Recibo = mongoose.model('Recibo', ReciboSchema);

// --- ROTAS DA API (O Front-end vai chamar aqui) ---

// 1. Salvar novo recibo
app.post('/api/recibos', async (req, res) => {
    try {
        const novoRecibo = new Recibo(req.body);
        const salvo = await novoRecibo.save();
        res.status(201).json(salvo);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao salvar recibo', detalhe: error.message });
    }
});

// 2. Listar todos os recibos (do mais novo para o mais antigo)
app.get('/api/recibos', async (req, res) => {
    try {
        const recibos = await Recibo.find().sort({ dataCriacao: -1 });
        res.json(recibos);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar recibos' });
    }
});

// 3. Deletar recibo
app.delete('/api/recibos/:id', async (req, res) => {
    try {
        await Recibo.findByIdAndDelete(req.params.id);
        res.json({ mensagem: 'Recibo deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao deletar' });
    }
});

// Rota padrão para o site
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- INICIAR SERVIDOR ---
app.listen(port, () => {
    console.log(`🚀 Servidor Nexus Digital rodando na porta ${port}`);
});
