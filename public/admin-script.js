// --- CONFIGURAÇÕES GLOBAIS ---
const API_URL = '/api'; // Endereço da sua API
let TOKEN = localStorage.getItem('admin_token') || null; // Recupera senha salva se houver

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    verificarLoginSalvo();
    
    // Configura o botão de login se ele existir no HTML
    const btnEntrar = document.getElementById('btn-entrar');
    if(btnEntrar) {
        btnEntrar.addEventListener('click', fazerLogin);
    }
});

// --- FUNÇÃO 1: SISTEMA DE LOGIN ---
function verificarLoginSalvo() {
    // Se não tiver token, mostra tela de login e esconde o painel
    if (!TOKEN) {
        mostrarTela('login-screen'); 
        document.getElementById('dashboard-content').style.display = 'none';
    } else {
        mostrarTela('dashboard-content');
        document.getElementById('login-screen').style.display = 'none';
        carregarFinanceiro(); // Já carrega os dados ao entrar
    }
}

async function fazerLogin() {
    const senhaInput = document.getElementById('senha-input').value;
    
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: senhaInput })
        });

        const data = await res.json();

        if (data.success) {
            TOKEN = data.token;
            localStorage.setItem('admin_token', TOKEN); // Salva para não pedir senha toda hora
            alert('Login realizado com sucesso!');
            location.reload(); // Recarrega para aplicar
        } else {
            alert('Senha Incorreta!');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

function sair() {
    localStorage.removeItem('admin_token');
    location.reload();
}

// --- FUNÇÃO 2: TROCA DE ABAS (CORRIGE O ERRO DO SEU PRINT) ---
// Essa é a função switchTab que estava dando "not defined"
function switchTab(tabId) {
    // 1. Esconde todas as seções de conteúdo
    const conteudos = document.querySelectorAll('.tab-content');
    conteudos.forEach(div => div.style.display = 'none');

    // 2. Remove a classe 'active' de todos os botões
    const botoes = document.querySelectorAll('.nav-btn'); // Supondo que seus botões tenham essa classe
    botoes.forEach(btn => btn.classList.remove('active'));

    // 3. Mostra a div clicada
    const abaAlvo = document.getElementById(tabId);
    if (abaAlvo) {
        abaAlvo.style.display = 'block';
        
        // Carrega os dados dependendo da aba
        if (tabId === 'financeiro-tab') carregarFinanceiro();
        if (tabId === 'precos-tab') carregarPrecos();
    } else {
        console.error(`Aba com ID '${tabId}' não encontrada no HTML.`);
    }
}

// Função auxiliar para mostrar telas (Login x Dashboard)
function mostrarTela(idTela) {
    const tela = document.getElementById(idTela);
    if(tela) tela.style.display = 'block';
}


// --- FUNÇÃO 3: FINANCEIRO ---
async function carregarFinanceiro() {
    if (!TOKEN) return;

    try {
        const res = await fetch(`${API_URL}/financeiro`, {
            headers: { 'Authorization': TOKEN }
        });
        const lista = await res.json();
        
        const tbody = document.getElementById('tabela-financeiro-body');
        if(!tbody) return; // Se não tiver tabela no HTML, ignora
        
        tbody.innerHTML = ''; // Limpa

        lista.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.dataFormatada || new Date(item.data).toLocaleDateString()}</td>
                <td>${item.categoria}</td>
                <td>${item.descricao}</td>
                <td style="color: ${item.tipo === 'entrada' ? 'green' : 'red'}">
                    R$ ${item.valor}
                </td>
                <td>
                    <button onclick="deletarItem('financeiro', '${item._id}')" style="color:red">X</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro financeiro:', error);
    }
}

// --- FUNÇÃO 4: TABELA DE PREÇOS ---
async function carregarPrecos() {
    try {
        const res = await fetch(`${API_URL}/precos`); // Preços é público no seu backend? Se não, adicione o header Auth
        const lista = await res.json();
        
        const tbody = document.getElementById('tabela-precos-body');
        if(!tbody) return;
        
        tbody.innerHTML = '';

        lista.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.marca}</td>
                <td>${p.modelo}</td>
                <td>R$ ${p.servico}</td>
                <td>R$ ${p.compraBloq}</td>
                <td>R$ ${p.compraOk}</td>
                ${TOKEN ? `<td><button onclick="deletarItem('precos', '${p._id}')">X</button></td>` : ''}
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro preços:', error);
    }
}

// --- FUNÇÃO 5: DELETAR ITENS ---
async function deletarItem(tipo, id) {
    if(!confirm('Tem certeza que deseja apagar?')) return;

    try {
        await fetch(`${API_URL}/${tipo}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': TOKEN }
        });
        
        // Recarrega a lista correta
        if(tipo === 'financeiro') carregarFinanceiro();
        if(tipo === 'precos') carregarPrecos();
        
    } catch (error) {
        alert('Erro ao deletar');
    }
}
