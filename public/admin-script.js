document.addEventListener('DOMContentLoaded', () => {
    // 1. VERIFICAÇÃO DE SEGURANÇA
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Configura headers padrão para usar o token
    const headers = { 
        'Content-Type': 'application/json',
        'Authorization': token 
    };

    // LOGOUT
    window.logout = () => {
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
    };

    // === ABAS ===
    window.switchTab = (tabName) => {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('tab-' + tabName).classList.add('active');
        event.currentTarget.classList.add('active');
        
        if(tabName === 'financeiro') loadFinanceiro();
        if(tabName === 'precos') loadPrecos();
    };

    // === MÁSCARA CPF ===
    window.maskCPF = (i) => {
        let v = i.value.replace(/\D/g, "");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        i.value = v;
    };

    // === 1. RECIBOS (LÓGICA EXISTENTE MELHORADA) ===
    const canvas = document.getElementById('signature-pad');
    const signaturePad = new SignaturePad(canvas, { backgroundColor: '#fff' });
    
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
    }
    window.addEventListener("resize", resizeCanvas);
    setTimeout(resizeCanvas, 500); // Garante resize ao carregar
    document.getElementById('clear-pad').addEventListener('click', () => signaturePad.clear());

    loadHistory();

    window.gerarPDF = async () => {
        if (signaturePad.isEmpty()) { alert("Assine primeiro!"); return; }
        
        const dados = {
            nome: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
            rg: document.getElementById('rg').value,
            endereco: document.getElementById('endereco').value,
            modelo: document.getElementById('modelo').value,
            imei: document.getElementById('imei').value,
            valor: document.getElementById('valor').value,
            estado: document.getElementById('estado').value,
            assinatura: signaturePad.toDataURL(),
            dataFormatada: new Date().toLocaleDateString('pt-BR'),
            horaFormatada: new Date().toLocaleTimeString('pt-BR')
        };

        try {
            // Salvar Recibo
            const res = await fetch('/api/recibos', { method: 'POST', headers, body: JSON.stringify(dados) });
            const salvo = await res.json();
            
            // Lançar no Financeiro se marcado
            if(document.getElementById('lancar-financeiro').checked) {
                await fetch('/api/financeiro', {
                    method: 'POST', headers,
                    body: JSON.stringify({
                        tipo: 'saida',
                        categoria: 'Compra Aparelho',
                        descricao: `Compra ${dados.modelo} - ${dados.nome}`,
                        valor: parseFloat(dados.valor),
                        dataFormatada: dados.dataFormatada
                    })
                });
            }

            gerarQRCodeEPDF(salvo);
            alert("✅ Salvo com sucesso!");
            loadHistory();
            signaturePad.clear();
        } catch (e) { alert("Erro ao salvar: " + e.message); }
    };

    // (MANTENHA A FUNÇÃO gerarQRCodeEPDF e criarArquivoPDF AQUI IGUAL AO SEU CÓDIGO ANTERIOR)
    // Para economizar espaço, vou resumir a chamada, mas você deve colar suas funções de PDF aqui.
    function gerarQRCodeEPDF(dados) {
        // ... sua lógica de PDF existente ...
        // Vou simular que chamei o PDF:
        const id = dados._id || Date.now();
        const container = document.getElementById("qrcode-container");
        new QRCode(container, { text: `ID:${id}`, width: 100, height: 100 });
        setTimeout(() => {
            const img = container.querySelector('canvas').toDataURL();
            criarArquivoPDF(dados, img, id);
        }, 100);
    }
    
    window.criarArquivoPDF = (d, qr, id) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        // ... (COLE AQUI A SUA LÓGICA DE PDF BONITA DO ARQUIVO ANTERIOR) ...
        // ... Use exatamente o código que você já tinha ...
        
        // Exemplo simplificado para garantir que funcione se você copiar só isso:
        doc.text(`RECIBO NEXUS - ${d.modelo}`, 20, 20);
        doc.text(`Valor: R$ ${d.valor}`, 20, 30);
        if(d.assinatura) doc.addImage(d.assinatura, 'PNG', 20, 50, 50, 20);
        doc.save(`Recibo_${d.nome}.pdf`);
    };

    async function loadHistory() {
        const tb = document.querySelector('#history-table tbody');
        const res = await fetch('/api/recibos', { headers });
        const lista = await res.json();
        tb.innerHTML = "";
        lista.forEach(i => {
            tb.innerHTML += `<tr>
                <td>${i.dataFormatada}</td><td>${i.nome}</td><td>${i.modelo}</td><td>R$ ${i.valor}</td>
                <td>
                    <button class="btn-delete" onclick="copiarZap('${i.modelo}', '${i.valor}', '${i.imei}')"><i class="fab fa-whatsapp"></i></button>
                    <button class="btn-delete" onclick="deletarRecibo('${i._id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        });
    }

    window.copiarZap = (mod, val, imei) => {
        const texto = `Olá! Segue resumo:\nModelo: ${mod}\nIMEI: ${imei}\nValor: R$ ${val}\n\nAssinado digitalmente.`;
        navigator.clipboard.writeText(texto);
        alert("Texto copiado para colar no WhatsApp!");
    };

    window.deletarRecibo = async (id) => {
        if(confirm("Apagar?")) { await fetch(`/api/recibos/${id}`, { method:'DELETE', headers }); loadHistory(); }
    };


    // === 2. FINANCEIRO (LÓGICA NOVA) ===
    async function loadFinanceiro() {
        const res = await fetch('/api/financeiro', { headers });
        const lista = await res.json();
        const tb = document.querySelector('#finance-table tbody');
        tb.innerHTML = "";
        
        let ent = 0, sai = 0;

        lista.forEach(i => {
            if(i.tipo === 'entrada') ent += i.valor;
            else sai += i.valor;
            
            const color = i.tipo === 'entrada' ? '#00ff88' : '#ff4444';
            const seta = i.tipo === 'entrada' ? '⬆' : '⬇';

            tb.innerHTML += `<tr>
                <td>${new Date(i.data).toLocaleDateString()}</td>
                <td style="color:${color}">${seta} ${i.tipo.toUpperCase()}</td>
                <td>${i.categoria}</td>
                <td>${i.descricao}</td>
                <td>R$ ${i.valor.toFixed(2)}</td>
                <td><button class="btn-delete" onclick="delFin('${i._id}')"><i class="fas fa-trash"></i></button></td>
            </tr>`;
        });

        document.getElementById('total-entradas').innerText = `R$ ${ent.toFixed(2)}`;
        document.getElementById('total-saidas').innerText = `R$ ${sai.toFixed(2)}`;
        const saldo = ent - sai;
        const elSaldo = document.getElementById('total-saldo');
        elSaldo.innerText = `R$ ${saldo.toFixed(2)}`;
        elSaldo.style.color = saldo >= 0 ? '#00ff88' : '#ff4444';
    }

    window.addFinanceiro = async () => {
        const dados = {
            tipo: document.getElementById('fin-tipo').value,
            categoria: document.getElementById('fin-cat').value,
            descricao: document.getElementById('fin-desc').value,
            valor: parseFloat(document.getElementById('fin-valor').value),
            dataFormatada: new Date().toLocaleDateString()
        };
        await fetch('/api/financeiro', { method: 'POST', headers, body: JSON.stringify(dados) });
        document.getElementById('fin-desc').value = "";
        document.getElementById('fin-valor').value = "";
        loadFinanceiro();
    };

    window.delFin = async (id) => {
        if(confirm("Remover lançamento?")) { await fetch(`/api/financeiro/${id}`, { method:'DELETE', headers }); loadFinanceiro(); }
    };


    // === 3. PREÇOS (LÓGICA NOVA COM BANCO DE DADOS) ===
    let todosPrecos = [];

    async function loadPrecos() {
        const res = await fetch('/api/precos'); // Pode ser publico ou privado, aqui ta publico no get
        todosPrecos = await res.json();
        renderPrecos(todosPrecos);
    }

    function renderPrecos(lista) {
        const container = document.getElementById('results-container');
        container.innerHTML = "";
        if(lista.length === 0) { container.innerHTML = "<p style='color:#666; text-align:center'>Nenhum preço cadastrado.</p>"; return; }

        lista.forEach(item => {
            const card = document.createElement('div');
            card.className = "price-card";
            card.innerHTML = `
                <div class="model-header">
                    <span class="model-name">${item.marca} - ${item.modelo}</span>
                    <button class="btn-delete" onclick="delPreco('${item._id}')" style="float:right"><i class="fas fa-trash"></i></button>
                </div>
                <div class="price-grid">
                    <div class="price-box" style="border-color: #00ff88;">
                        <span class="price-label">Serviço</span>
                        <span class="price-value" style="color:#00ff88">${item.servico}</span>
                    </div>
                    <div class="price-box">
                        <span class="price-label">Compra Bloq.</span>
                        <span class="price-value" style="color:#ffaa00">${item.compraBloq}</span>
                    </div>
                    <div class="price-box">
                        <span class="price-label">Compra OK</span>
                        <span class="price-value" style="color:#00d4ff">${item.compraOk}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    window.addPreco = async () => {
        const dados = {
            marca: document.getElementById('p-marca').value,
            modelo: document.getElementById('p-modelo').value,
            servico: document.getElementById('p-serv').value,
            compraBloq: document.getElementById('p-compra-bad').value,
            compraOk: document.getElementById('p-compra-ok').value
        };
        await fetch('/api/precos', { method: 'POST', headers, body: JSON.stringify(dados) });
        alert("Preço adicionado!");
        loadPrecos();
    };

    window.filtrarPrecos = () => {
        const termo = document.getElementById('searchInput').value.toLowerCase();
        const filtrados = todosPrecos.filter(i => 
            i.modelo.toLowerCase().includes(termo) || i.marca.toLowerCase().includes(termo)
        );
        renderPrecos(filtrados);
    };
    
    window.delPreco = async (id) => {
        if(confirm("Apagar modelo?")) { await fetch(`/api/precos/${id}`, { method:'DELETE', headers }); loadPrecos(); }
    };
});
