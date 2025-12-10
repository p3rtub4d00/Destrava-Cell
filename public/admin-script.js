document.addEventListener('DOMContentLoaded', () => {
    // 1. Configurar o Pad de Assinatura
    const canvas = document.getElementById('signature-pad');
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)', // Fundo branco para o PDF ficar limpo
        penColor: 'rgb(0, 0, 0)'
    });

    // Ajustar tamanho do canvas para telas de celular (Retina display fix)
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear(); // Limpa ao redimensionar
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Botão Limpar
    document.getElementById('clear-pad').addEventListener('click', () => {
        signaturePad.clear();
    });

    // 2. Função Gerar PDF
    window.gerarPDF = async () => {
        if (signaturePad.isEmpty()) {
            alert("Erro: O cliente precisa assinar antes de gerar o recibo.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Pegar dados do formulário
        const nome = document.getElementById('nome').value || "Não informado";
        const cpf = document.getElementById('cpf').value || "Não informado";
        const rg = document.getElementById('rg').value || "Não informado";
        const endereco = document.getElementById('endereco').value || "Não informado";
        const modelo = document.getElementById('modelo').value || "Não informado";
        const imei = document.getElementById('imei').value || "Não informado";
        const valor = document.getElementById('valor').value || "0,00";
        const estado = document.getElementById('estado').value;
        const dataHoje = new Date().toLocaleDateString('pt-BR');

        // Configuração do PDF (Design simples e jurídico)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("RECIBO E DECLARAÇÃO DE VENDA", 105, 20, null, null, "center");

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        let y = 40; // Posição vertical inicial

        // Dados da Loja (Fixo)
        doc.setFont("helvetica", "bold");
        doc.text("COMPRADOR (LOJA):", 20, y);
        doc.setFont("helvetica", "normal");
        y += 7;
        doc.text("DESTRAVA CELL - Soluções em Software", 20, y);
        y += 5;
        doc.text("Porto Velho - Rondônia", 20, y);
        
        y += 15;

        // Dados do Vendedor
        doc.setFont("helvetica", "bold");
        doc.text("VENDEDOR (CLIENTE):", 20, y);
        doc.setFont("helvetica", "normal");
        y += 7;
        doc.text(`Nome: ${nome}`, 20, y);
        y += 5;
        doc.text(`CPF: ${cpf}   |   RG: ${rg}`, 20, y);
        y += 5;
        doc.text(`Endereço: ${endereco}`, 20, y);

        y += 15;

        // Dados do Aparelho
        doc.setFont("helvetica", "bold");
        doc.text("OBJETO DA VENDA:", 20, y);
        doc.setFont("helvetica", "normal");
        y += 7;
        doc.text(`Aparelho: ${modelo}`, 20, y);
        y += 5;
        doc.text(`IMEI: ${imei}`, 20, y);
        y += 5;
        doc.text(`Estado: ${estado}`, 20, y);

        y += 15;

        // Valor
        doc.setFont("helvetica", "bold");
        doc.text(`VALOR PAGO: R$ ${valor}`, 20, y);
        
        y += 15;

        // Termos Jurídicos
        doc.setFontSize(9);
        doc.text("DECLARAÇÃO DE RESPONSABILIDADE:", 20, y);
        y += 7;
        const termos = [
            "1. Declaro ser o legítimo proprietário do aparelho acima descrito.",
            "2. Declaro que o aparelho tem origem lícita e NÃO É produto de crime (Roubo/Furto).",
            "3. Estou ciente de que serei responsabilizado criminalmente caso o aparelho seja",
            "bloqueado por furto/roubo após esta data.",
            "4. Transfiro a posse e propriedade para a Destrava Cell."
        ];
        
        termos.forEach(linha => {
            doc.text(linha, 20, y);
            y += 5;
        });

        y += 10;
        doc.text(`Porto Velho - RO, ${dataHoje}`, 20, y);

        y += 30; // Espaço para assinatura

        // Inserir a imagem da assinatura
        const signatureImg = signaturePad.toDataURL(); // Pega a imagem do canvas
        doc.addImage(signatureImg, 'PNG', 20, y - 25, 60, 30); // Posição X, Y, Largura, Altura

        // Linha da assinatura
        doc.line(20, y, 100, y);
        doc.text("Assinatura do Vendedor", 20, y + 5);

        // Salvar PDF
        const nomeArquivo = `Recibo_${nome.split(' ')[0]}_${modelo}.pdf`;
        doc.save(nomeArquivo);
    };
});
