require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;
const ADMIN_PASSWORD = process.env.ADMIN_PASS || "nexus2025"; // Senha padrão se não configurar no .env

// Conexão MongoDB
if (!mongoURI) {
    console.error("❌ ERRO: Configure a MONGO_URI no Render.");
} else {
    mongoose.connect(mongoURI)
        .then(() => console.log('✅ MongoDB Conectado!'))
        .catch(err => console.error('❌ Erro Mongo:', err));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- MODELS (Tabelas do Banco) ---

// 1. Recibos (Já existia)
const ReciboSchema = new mongoose.Schema({
    nome: String, cpf: String, rg: String, endereco: String,
    modelo: String, imei: String, valor: String, estado: String,
    assinatura: String,
    dataCriacao: { type: Date, default: Date.now },
    dataFormatada: String, horaFormatada: String
});
const Recibo = mongoose.model('Recibo', ReciboSchema);

// 2. Financeiro (NOVO)
const TransacaoSchema = new mongoose.Schema({
    tipo: String, // 'entrada' ou 'saida'
    categoria: String, // 'Serviço', 'Venda', 'Compra', 'Custo'
    descricao: String,
    valor: Number,
    data: { type: Date, default: Date.now },
    dataFormatada: String
});
const Transacao = mongoose.model('Transacao', TransacaoSchema);

// --- ROTAS API ---

// Login Simples
app.post('/api/login', (req, res) => {
    const { senha } = req.body;
    if (senha === ADMIN_PASSWORD) {
        res.json({ auth: true });
    } else {
        res.status(401).json({ auth: false, erro: "Senha Incorreta" });
    }
});

// === RECIBOS ===
app.post('/api/recibos', async (req, res) => {
    try {
        const novo = new Recibo(req.body);
        const salvo = await novo.save();
        res.status(201).json(salvo);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.get('/api/recibos', async (req, res) => {
    try {
        const lista = await Recibo.find({}, 'nome modelo valor dataFormatada _id').sort({ dataCriacao: -1 });
        res.json(lista);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.get('/api/recibos/:id', async (req, res) => {
    try {
        const item = await Recibo.findById(req.params.id);
        res.json(item);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.delete('/api/recibos/:id', async (req, res) => {
    try {
        await Recibo.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// === FINANCEIRO (NOVO) ===
app.post('/api/financeiro', async (req, res) => {
    try {
        const novaTransacao = new Transacao(req.body);
        const salva = await novaTransacao.save();
        res.status(201).json(salva);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.get('/api/financeiro', async (req, res) => {
    try {
        const lista = await Transacao.find().sort({ data: -1 }).limit(50); // Últimas 50
        res.json(lista);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.delete('/api/financeiro/:id', async (req, res) => {
    try {
        await Transacao.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// Front-end
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(port, () => console.log(`🚀 Server on port ${port}`));
