document.addEventListener('DOMContentLoaded', () => {
    // === 1. CONFIGURAÇÃO DA ASSINATURA ===
    const canvas = document.getElementById('signature-pad');
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });

    // Ajusta o tamanho do canvas para telas de alta resolução (Celular)
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    document.getElementById('clear-pad').addEventListener('click', () => {
        signaturePad.clear();
    });

    // === 2. CARREGAR HISTÓRICO AO INICIAR A PÁGINA ===
    loadHistory();

    // === 3. FUNÇÃO PRINCIPAL: GERAR E SALVAR ===
    window.gerarPDF = async () => {
        if (signaturePad.isEmpty()) {
            alert("Erro: O cliente precisa assinar antes de salvar.");
            return;
        }

        // Coletar Dados do Formulário
        const dados = {
            id: Date.now(), // ID único
            data: new Date().toLocaleDateString('pt-BR'),
            hora: new Date().toLocaleTimeString('pt-BR'),
            nome: document.getElementById('nome').value || "Não Informado",
            cpf: document.getElementById('cpf').value || "",
            rg: document.getElementById('rg').value || "",
            endereco: document.getElementById('endereco').value || "",
            modelo: document.getElementById('modelo').value || "",
            imei: document.getElementById('imei').value || "",
            valor: document.getElementById('valor').value || "0,00",
            estado: document.getElementById('estado').value,
            assinatura: signaturePad.toDataURL() // Imagem da assinatura em Base64
        };

        // Salvar na memória do navegador
        salvarNoHistorico(dados);

        // Gerar o PDF para download
        criarArquivoPDF(dados);

        // Limpar formulário
        alert("Recibo salvo e baixado com sucesso!");
        signaturePad.clear();
        document.getElementById('nome').value = "";
        document.getElementById('cpf').value = "";
        document.getElementById('rg').value = "";
        document.getElementById('endereco').value = "";
        document.getElementById('modelo').value = "";
        document.getElementById('imei').value = "";
        document.getElementById('valor').value = "";
    };

    // === 4. FUNÇÃO QUE DESENHA O PDF ===
    window.criarArquivoPDF = (d) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setTextColor(0, 0, 0); // Texto Preto

        // Cabeçalho Nexus Digital
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("RECIBO E DECLARAÇÃO DE VENDA", 105, 20, null, null, "center");
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Documento gerado pelo sistema NEXUS DIGITAL", 105, 26, null, null, "center");

        let y = 45;

        // Bloco LOJA (Nexus Digital / Destrava Cell)
        doc.setFont("helvetica", "bold");
        doc.text("COMPRADOR (LOJA):", 20, y);
        doc.setFont("helvetica", "normal");
        y += 6;
        doc.text("DESTRAVA CELL (Uma empresa NEXUS DIGITAL)", 20, y);
        y += 5;
        doc.text("CNPJ: Processando... | Porto Velho - RO", 20, y);
        y += 15;

        // Bloco VENDEDOR
        doc.setFont("helvetica", "bold");
        doc.text("VENDEDOR (CLIENTE):", 20, y);
        doc.setFont("helvetica", "normal");
        y += 6;
        doc.text(`Nome: ${d.nome}`, 20, y);
        y += 5;
        doc.text(`CPF: ${d.cpf}  |  RG: ${d.rg}`, 20, y);
        y += 5;
        doc.text(`Endereço: ${d.endereco}`, 20, y);
        y += 15;

        // Bloco PRODUTO
        doc.setFont("helvetica", "bold");
        doc.text("OBJETO DA VENDA:", 20, y);
        doc.setFont("helvetica", "normal");
        y += 6;
        doc.text(`Aparelho: ${d.modelo}`, 20, y);
        y += 5;
        doc.text(`IMEI: ${d.imei}`, 20, y);
        y += 5;
        doc.text(`Estado: ${d.estado}`, 20, y);
        y += 15;

        // Valor
        doc.setFont("helvetica", "bold");
        doc.text(`VALOR PAGO: R$ ${d.valor}`, 20, y);
        y += 15;

        // Declarações Legais
        doc.setFontSize(9);
        doc.text("DECLARAÇÃO DE RESPONSABILIDADE CIVIL E CRIMINAL:", 20, y);
        y += 6;
        const termos = [
            "1. Declaro sob as penas da lei ser o legítimo proprietário do aparelho.",
            "2. Declaro que o aparelho tem origem lícita e NÃO É produto de crime (Roubo/Furto).",
            "3. Estou ciente de que serei responsabilizado caso o aparelho entre em Blacklist.",
            "4. Transfiro a posse e propriedade para o Grupo Nexus Digital / Destrava Cell."
        ];
        termos.forEach(t => {
            doc.text(t, 20, y);
            y += 5;
        });

        y += 10;
        doc.text(`Porto Velho - RO, ${d.data} às ${d.hora}`, 20, y);

        // Assinatura
        y = 220; 
        if(d.assinatura) {
            doc.addImage(d.assinatura, 'PNG', 20, y - 20, 50, 25);
        }
        doc.line(20, y, 90, y);
        doc.text("Assinatura do Vendedor", 20, y + 5);

        // === AVISO LEGAL (RODAPÉ FIXO) ===
        const avisoLegal = "Aviso Legal: A Destrava Cell e o Grupo Nexus Digital repudiam qualquer atividade ilícita. Realizamos consulta prévia de IMEI em todos os aparelhos. Não compramos e não desbloqueamos aparelhos com restrição de roubo ou furto (Blacklist). Nossos serviços destinam-se a proprietários legítimos que perderam acesso às suas contas ou desejam quitar débitos contratuais.";
        
        doc.setFontSize(7);
        doc.setTextColor(50, 50, 50); // Cinza escuro
        doc.text(avisoLegal, 20, 280, { maxWidth: 170, align: "justify" });

        // Salvar Arquivo
        const nomeArquivo = `Recibo_${d.nome.split(' ')[0]}_${d.id}.pdf`;
        doc.save(nomeArquivo);
    };

    // === 5. SISTEMA DE BANCO DE DADOS LOCAL (LocalStorage) ===
    function salvarNoHistorico(dados) {
        // Pega o que já tem salvo ou cria lista nova
        let historico = JSON.parse(localStorage.getItem('nexus_recibos')) || [];
        
        // Adiciona o novo no começo da lista
        historico.unshift(dados);
        
        // Salva de volta no navegador
        localStorage.setItem('nexus_recibos', JSON.stringify(historico));
        
        // Atualiza a tabela na hora
        loadHistory();
    }

    function loadHistory() {
        const tbody = document.querySelector('#history-table tbody');
        tbody.innerHTML = ""; // Limpa a tabela antes de recarregar

        let historico = JSON.parse(localStorage.getItem('nexus_recibos')) || [];

        if (historico.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px;'>Nenhum registro encontrado neste dispositivo.</td></tr>";
            return;
        }

        historico.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.data}</td>
                <td>${item.nome}</td>
                <td>${item.modelo}</td>
                <td style="color:var(--primary-color)">R$ ${item.valor}</td>
                <td>
                    <button class="btn-reprint" onclick="reimprimir(${item.id})"><i class="fas fa-print"></i> PDF</button>
                    <button class="btn-delete" onclick="deletar(${item.id})"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Função para gerar PDF de novo a partir do histórico
    window.reimprimir = (id) => {
        let historico = JSON.parse(localStorage.getItem('nexus_recibos')) || [];
        const item = historico.find(i => i.id === id);
        if (item) {
            criarArquivoPDF(item);
        }
    };

    // Função para apagar
    window.deletar = (id) => {
        if(confirm("Tem certeza que deseja apagar este registro do histórico?")) {
            let historico = JSON.parse(localStorage.getItem('nexus_recibos')) || [];
            historico = historico.filter(i => i.id !== id);
            localStorage.setItem('nexus_recibos', JSON.stringify(historico));
            loadHistory();
        }
    };
});
