document.addEventListener('DOMContentLoaded', () => {
    // === CONFIGURAÇÃO DA ASSINATURA ===
    const canvas = document.getElementById('signature-pad');
    const signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)', penColor: 'rgb(0, 0, 0)' });

    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    document.getElementById('clear-pad').addEventListener('click', () => signaturePad.clear());

    // Carrega o histórico
    loadHistory();

    // === GERAR E SALVAR NO BANCO ===
    window.gerarPDF = async () => {
        if (signaturePad.isEmpty()) { alert("Assinatura obrigatória!"); return; }

        const btn = document.querySelector('.btn-generate');
        const txtOriginal = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando na Nuvem...';
        btn.disabled = true;

        const dadosFormulario = {
            nome: document.getElementById('nome').value || "---",
            cpf: document.getElementById('cpf').value || "---",
            rg: document.getElementById('rg').value || "---",
            endereco: document.getElementById('endereco').value || "---",
            modelo: document.getElementById('modelo').value || "---",
            imei: document.getElementById('imei').value || "---",
            valor: document.getElementById('valor').value || "0,00",
            estado: document.getElementById('estado').value,
            assinatura: signaturePad.toDataURL(),
            dataFormatada: new Date().toLocaleDateString('pt-BR'),
            horaFormatada: new Date().toLocaleTimeString('pt-BR')
        };

        try {
            const resposta = await fetch('/api/recibos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosFormulario)
            });

            if (!resposta.ok) throw new Error('Falha ao comunicar com o servidor');
            
            const dadosSalvos = await resposta.json();

            // Gera o PDF
            gerarQRCodeEPDF(dadosSalvos);

            alert("✅ Recibo salvo e sincronizado com sucesso!");
            
            // Limpa tudo
            signaturePad.clear();
            document.getElementById('nome').value = "";
            document.getElementById('modelo').value = "";
            document.getElementById('imei').value = "";
            document.getElementById('valor').value = "";
            
            // Atualiza a tabela
            loadHistory();

        } catch (error) {
            console.error(error);
            alert("❌ Erro ao salvar: " + error.message);
        } finally {
            btn.innerHTML = txtOriginal;
            btn.disabled = false;
        }
    };

    // === PDF + QR CODE ===
    function gerarQRCodeEPDF(dados) {
        const idRecibo = dados._id || Date.now();
        const qrData = `NEXUS DIGITAL\nID: ${idRecibo}\nIMEI: ${dados.imei}\nVALOR: R$ ${dados.valor}`;
        const qrContainer = document.getElementById("qrcode-container");
        qrContainer.innerHTML = "";
        
        new QRCode(qrContainer, { text: qrData, width: 100, height: 100 });

        setTimeout(() => {
            const qrCanvas = qrContainer.querySelector('canvas');
            const qrImg = qrCanvas ? qrCanvas.toDataURL("image/png") : null;
            criarArquivoPDF(dados, qrImg, idRecibo);
        }, 100);
    }

    window.criarArquivoPDF = (d, qrImg, idRecibo) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Estilos
        doc.setLineWidth(0.5); doc.setDrawColor(0); doc.setTextColor(0);

        // Cabeçalho
        doc.setFont("helvetica", "bold"); doc.setFontSize(22);
        doc.text("NEXUS DIGITAL", 105, 20, null, null, "center");
        doc.setFontSize(10); doc.setFont("helvetica", "normal");
        doc.text("Divisão: Destrava Cell | Soluções Mobile", 105, 26, null, null, "center");
        doc.line(10, 30, 200, 30);

        doc.setFontSize(14); doc.setFont("helvetica", "bold");
        doc.text("RECIBO DE VENDA E TRANSFERÊNCIA", 105, 40, null, null, "center");

        if(qrImg) doc.addImage(qrImg, 'PNG', 170, 10, 30, 30);

        let y = 50;
        
        // Tratamento de segurança para dados vazios
        const nomeCliente = d.nome || "Cliente";
        const dataShow = d.dataFormatada || "--/--/--";
        const horaShow = d.horaFormatada || "--:--";

        // Bloco Transação
        doc.setFillColor(240, 240, 240); doc.rect(15, y, 180, 10, 'F');
        doc.setFontSize(10); doc.setFont("helvetica", "bold");
        doc.text("DADOS DA TRANSAÇÃO", 20, y+7); y += 15;
        doc.setFontSize(10); doc.setFont("helvetica", "normal");
        doc.text(`Data: ${dataShow} às ${horaShow}`, 20, y);
        doc.text(`ID Cloud: #${idRecibo.toString().slice(-6)}`, 120, y); 
        y += 10;
        doc.setFont("helvetica", "bold"); doc.text(`VALOR PAGO: R$ ${d.valor}`, 20, y); y += 15;

        // Bloco Vendedor
        doc.setFillColor(240, 240, 240); doc.rect(15, y, 180, 10, 'F');
        doc.text("IDENTIFICAÇÃO DO VENDEDOR", 20, y+7); y += 15;
        doc.setFont("helvetica", "normal");
        doc.text(`Nome: ${nomeCliente}`, 20, y); y += 6;
        doc.text(`CPF: ${d.cpf} / RG: ${d.rg}`, 20, y); y += 6;
        doc.text(`Endereço: ${d.endereco}`, 20, y); y += 15;

        // Bloco Produto
        doc.setFillColor(240, 240, 240); doc.rect(15, y, 180, 10, 'F');
        doc.setFont("helvetica", "bold"); doc.text("APARELHO", 20, y+7); y += 15;
        doc.setFont("helvetica", "normal");
        doc.text(`Modelo: ${d.modelo}`, 20, y); y += 6;
        doc.text(`IMEI: ${d.imei}`, 20, y); y += 6;
        doc.text(`Estado: ${d.estado}`, 20, y); y += 20;

        // Termos
        doc.setFont("helvetica", "bold"); doc.setFontSize(9);
        doc.text("TERMOS E RESPONSABILIDADE LEGAL:", 20, y); y += 6;
        doc.setFont("helvetica", "normal"); doc.setFontSize(8);
        const termos = [
            "1. O VENDEDOR declara ser o proprietário legítimo e que o bem é LÍCITO.",
            "2. O VENDEDOR isenta o Grupo NEXUS DIGITAL de responsabilidade civil/criminal.",
            "3. O VENDEDOR assume responsabilidade caso o aparelho entre em Blacklist (Roubo/Furto).",
            "4. A posse é transferida neste ato, em caráter irrevogável."
        ];
        termos.forEach(t => { doc.text(t, 20, y); y += 4; });

        y += 20;
        if(d.assinatura) {
            doc.rect(60, y-5, 90, 35);
            doc.addImage(d.assinatura, 'PNG', 75, y, 60, 25);
        }
        y += 35;
        doc.setFontSize(8); doc.setFont("helvetica", "bold");
        doc.text("ASSINATURA DO VENDEDOR", 105, y, null, null, "center");

        // Rodapé
        doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(100);
        doc.text("Aviso Legal: A Destrava Cell e o Grupo Nexus Digital repudiam atividades ilícitas. Realizamos consulta prévia de IMEI.", 105, 285, null, null, "center");

        // Nome do arquivo seguro
        const safeName = nomeCliente.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`Recibo_Nexus_${safeName}.pdf`);
    };

    // === FUNÇÕES DE DADOS (API) ===
    
    async function loadHistory() {
        const tbody = document.querySelector('#history-table tbody');
        if(!tbody) return;

        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center'>🔄 Buscando dados...</td></tr>";

        try {
            const res = await fetch('/api/recibos');
            if (!res.ok) throw new Error("Erro na API");
            const recibos = await res.json();

            tbody.innerHTML = "";
            if (recibos.length === 0) {
                tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px;'>Nenhum registro encontrado.</td></tr>";
                return;
            }

            recibos.forEach(item => {
                const tr = document.createElement('tr');
                const dataShow = item.dataFormatada || "--/--";
                tr.innerHTML = `
                    <td>${dataShow}</td>
                    <td>${item.nome}</td>
                    <td>${item.modelo}</td>
                    <td style="color:var(--primary-color)">R$ ${item.valor}</td>
                    <td>
                        <button class="btn-reprint" onclick="reimprimir('${item._id}')"><i class="fas fa-print"></i> PDF</button>
                        <button class="btn-delete" onclick="deletar('${item._id}')"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error(error);
            tbody.innerHTML = "<tr><td colspan='5' style='color:red; text-align:center'>Erro de conexão com o Banco de Dados.</td></tr>";
        }
    }

    // --- AQUI ESTAVA O ERRO, AGORA ESTÁ CORRIGIDO ---
    window.reimprimir = async (id) => {
        try {
            // Busca APENAS o recibo específico pelo ID (Rota nova)
            const res = await fetch(`/api/recibos/${id}`);
            
            if (!res.ok) throw new Error("Recibo não encontrado ou erro no servidor.");
            
            const item = await res.json();
            
            // Gera o PDF com os dados que vieram do banco
            gerarQRCodeEPDF(item);

        } catch (e) { 
            console.error(e);
            alert("Erro ao recuperar PDF: " + e.message); 
        }
    };

    window.deletar = async (id) => {
        if(confirm("Apagar este registro permanentemente?")) {
            try {
                await fetch(`/api/recibos/${id}`, { method: 'DELETE' });
                loadHistory(); 
            } catch (e) { alert("Erro ao deletar."); }
        }
    };
});
