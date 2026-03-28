document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calc-form');
    const resultsContainer = document.getElementById('results');
    const downloadBtn = document.getElementById('download-txt');

    let currentResults = null;
    let baseBombas = []; // Banco de dados Leão carregado do JSON

    // Carregar o banco de dados diretamente da variável global (resolvendo problema de CORS local)
    if (typeof baseBombasData !== 'undefined') {
        baseBombas = baseBombasData;
        console.log(`Banco Leão carregado: ${baseBombas.length} modelos.`);
    } else {
        console.error("Erro ao carregar banco de dados: arquivo bombas_leao.js falhou ao iniciar.");
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Obter os valores de entrada
        const vazaoStr = document.getElementById('vazao').value;
        const nivelDinamicoStr = document.getElementById('nivelDinamico').value;
        const profundidadeInstalacaoStr = document.getElementById('profundidadeInstalacao').value;
        const desnivelVerticalStr = document.getElementById('desnivelVertical').value;
        const distanciaHorizontalStr = document.getElementById('distanciaHorizontal').value;
        const perdaCargaStr = document.getElementById('perdaCarga').value;
        const rendimentoStr = document.getElementById('rendimento').value;
        const tensaoRedeSelect = document.getElementById('tensaoRede').value;

        // Converter para float (substituindo vírgula caso o usuário digite no navegador)
        const vazao = parseFloat(vazaoStr.replace(',', '.'));
        const nivelDinamico = parseFloat(nivelDinamicoStr.replace(',', '.'));
        const profundidadeInstalacao = parseFloat(profundidadeInstalacaoStr.replace(',', '.'));
        const desnivelVertical = parseFloat(desnivelVerticalStr.replace(',', '.'));
        const distanciaHorizontal = parseFloat(distanciaHorizontalStr.replace(',', '.'));
        const perdaCarga = parseFloat(perdaCargaStr.replace(',', '.'));
        const rendimento = parseFloat(rendimentoStr.replace(',', '.'));

        if (isNaN(vazao) || isNaN(nivelDinamico) || isNaN(profundidadeInstalacao) || isNaN(desnivelVertical) || isNaN(distanciaHorizontal) || isNaN(perdaCarga) || isNaN(rendimento) || !tensaoRedeSelect) {
            alert('Por favor, preencha todos os campos corretamente com números e selecione a tensão da rede.');
            return;
        }

        // 1. Cálculo da Altura Manométrica Total (MCA)
        const alturaGeometrica = nivelDinamico + desnivelVertical;
        const comprimentoDaTubulacao = profundidadeInstalacao + desnivelVertical + distanciaHorizontal;

        // Estimativa de perda de carga (%) do comprimento total
        // A perda de carga ocorre tanto na edutora quanto na adutora
        const perdaDeCarga = comprimentoDaTubulacao * (perdaCarga / 100);

        let mca = alturaGeometrica + perdaDeCarga;
        const mcaDisplay = Math.ceil(mca); // Arredondar para cima para margem de segurança na exibição

        // 2. Recomendação de Diâmetro de Tubulação baseado na Vazão (m³/h)
        // Regra prática para manter velocidade adequada na tubulação da bomba caneta
        let diametroH = "";
        if (vazao <= 1.5) diametroH = '3/4" (25mm)';
        else if (vazao <= 3.0) diametroH = '1" (32mm)';
        else if (vazao <= 5.0) diametroH = '1 1/4" (40mm)';
        else if (vazao <= 8.0) diametroH = '1 1/2" (50mm)';
        else if (vazao <= 12.0) diametroH = '2" (60mm)';
        else if (vazao <= 18.0) diametroH = '2 1/2" (75mm)';
        else if (vazao <= 30.0) diametroH = '3" (85mm)';
        else diametroH = '4" ou superior (>100mm)';

        // 3. Cálculo da Potência da Bomba (CV)
        // Fórmula aproximada: P(cv) = (Q(m³/h) * MCA) / (270 * Rendimento)
        const potenciaCalculada = (vazao * mca) / (270 * rendimento);

        // Arredondar para potência comercial superior
        const potenciasComerciais = [0.33, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 7.5, 10.0, 12.5, 15.0, 20.0, 25.0, 30.0];
        let potenciaRecomendada = potenciasComerciais[potenciasComerciais.length - 1]; // Fallback para a maior

        for (let i = 0; i < potenciasComerciais.length; i++) {
            if (potenciaCalculada <= potenciasComerciais[i]) {
                potenciaRecomendada = potenciasComerciais[i];
                break;
            }
        }

        // 4. Cálculo de Cabo Elétrico (Aproximação)
        const comprimentoBombaPainel = profundidadeInstalacao + 10;
        const potenciaWatts = potenciaRecomendada * 735.5;
        const fpEstimado = 0.8;
        const rendimentoMotorEstimado = 0.65;
        const resistividadeCobre = 0.0172; // ohms.mm2/m
        const quedaTensaoMax = 0.04; // 4% permitida

        const bitolasComerciais = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];

        function calcularBitola(tensao, isTrifasico) {
            let corrente;
            let secaoCalculada;
            const quedaAdmissivel = tensao * quedaTensaoMax;

            if (isTrifasico) {
                corrente = potenciaWatts / (Math.sqrt(3) * tensao * fpEstimado * rendimentoMotorEstimado);
                secaoCalculada = (Math.sqrt(3) * resistividadeCobre * comprimentoBombaPainel * corrente) / quedaAdmissivel;
            } else {
                corrente = potenciaWatts / (tensao * fpEstimado * rendimentoMotorEstimado);
                secaoCalculada = (2 * resistividadeCobre * comprimentoBombaPainel * corrente) / quedaAdmissivel;
            }

            let bitolaRecomendada = bitolasComerciais[bitolasComerciais.length - 1]; //Fallback maior
            for (let i = 0; i < bitolasComerciais.length; i++) {
                if (bitolasComerciais[i] >= secaoCalculada && bitolasComerciais[i] >= 2.5) { //Mínimo normativo NBR 5410
                    bitolaRecomendada = bitolasComerciais[i];
                    break;
                }
            }
            return bitolaRecomendada;
        }

        let bitolaEspecifica;
        let lblTensao;

        if (tensaoRedeSelect === '220_mono') {
            bitolaEspecifica = calcularBitola(220, false);
            lblTensao = '220V Mono:';
        } else if (tensaoRedeSelect === '220_tri') {
            bitolaEspecifica = calcularBitola(220, true);
            lblTensao = '220V Tri:';
        } else if (tensaoRedeSelect === '380_tri') {
            bitolaEspecifica = calcularBitola(380, true);
            lblTensao = '380V Tri:';
        }

        // 5. Motor de Busca: Sugestão Automática de Bomba Leão
        let bombaRecomendada = null;
        if (baseBombas.length > 0) {
            let menorDiferencaH = Infinity;
            for (const bomba of baseBombas) {
                const curva = bomba.curva;
                if (!curva || curva.length === 0) continue;

                if (vazao < curva[0].q || vazao > curva[curva.length - 1].q) continue; // Fora do escopo de vazão da bomba

                let h_estimado = null;
                for (let i = 0; i < curva.length - 1; i++) {
                    const p1 = curva[i];
                    const p2 = curva[i + 1];
                    if (p1.q <= vazao && vazao <= p2.q) {
                        if (p1.q === p2.q) { h_estimado = p1.h; } 
                        else { h_estimado = p1.h + ((p2.h - p1.h) * ((vazao - p1.q) / (p2.q - p1.q))); }
                        break;
                    }
                }
                
                if (h_estimado === null && vazao === curva[curva.length - 1].q) {
                    h_estimado = curva[curva.length - 1].h;
                }

                if (h_estimado !== null && h_estimado >= mca) {
                    const diffH = h_estimado - mca;
                    if (!bombaRecomendada || 
                        bomba.potencia_cv < bombaRecomendada.potencia_cv || 
                        (bomba.potencia_cv === bombaRecomendada.potencia_cv && diffH < menorDiferencaH)) {
                        bombaRecomendada = {
                            ...bomba,
                            h_ponto: h_estimado,
                            q_ponto: vazao
                        };
                        menorDiferencaH = diffH;
                    }
                }
            }
        }

        // Armazenar resultados para o memorial
        currentResults = {
            inputs: { vazao, nivelDinamico, profundidadeInstalacao, desnivelVertical, distanciaHorizontal, perdaCarga, rendimento, tensao: lblTensao.replace(':', '') },
            intermediate: { alturaGeometrica, perdaDeCarga, potenciaCalculada },
            outputs: { mcaDisplay, potenciaRecomendada, diametroH, comprimentoDaTubulacao, mca, comprimentoBombaPainel, bitolaEspecifica, bombaRecomendada }
        };

        // Formatar e Exibir resultados
        document.getElementById('res-mca').textContent = `${mcaDisplay} m.c.a.`;
        document.getElementById('res-potencia').textContent = `${potenciaRecomendada} cv`;
        document.getElementById('res-diametro').textContent = diametroH;
        document.getElementById('res-comprimento').textContent = comprimentoDaTubulacao.toFixed(1).replace('.', ',');
        document.getElementById('res-dist-cabo').textContent = comprimentoBombaPainel;
        document.getElementById('res-tensao-lbl').textContent = lblTensao;
        document.getElementById('res-cabo-bitola').textContent = `${bitolaEspecifica} mm²`;
        document.getElementById('res-nota-perda').textContent = perdaCarga;
        document.getElementById('res-nota-rendimento').textContent = (rendimento * 100).toFixed(0);

        if (bombaRecomendada) {
            document.getElementById('card-bomba-leao').classList.remove('hidden');
            document.getElementById('res-bomba-modelo').textContent = bombaRecomendada.modelo;
            document.getElementById('res-bomba-potencia').textContent = `Ponto Operacional: ${bombaRecomendada.q_ponto.toFixed(1)} m³/h a ${bombaRecomendada.h_ponto.toFixed(1)} m.c.a. (${bombaRecomendada.potencia_cv} cv)`;
        } else {
            document.getElementById('card-bomba-leao').classList.add('hidden');
        }

        // Mostrar o container de resultados e o botão de download
        resultsContainer.classList.remove('hidden');
        downloadBtn.classList.remove('hidden');

        // Animação de entrada dos cards
        const cards = document.querySelectorAll('.result-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.4s ease forwards';

            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * (index + 1));
        });

        // Scroll suave para os resultados
        setTimeout(() => {
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    });

    // Função para baixar o arquivo
    downloadBtn.addEventListener('click', () => {
        if (!currentResults) return;

        const date = new Date().toLocaleString('pt-BR');
        const content = `
MEMORIAL DE CÁLCULO - HYDROCALC PRO
Data: ${date}
-------------------------------------------

DADOS DE ENTRADA:
- Vazão Desejada (Q): ${currentResults.inputs.vazao} m³/h
- Nível Dinâmico do Poço (ND): ${currentResults.inputs.nivelDinamico} m
- Profundidade Instalação Bomba (PI): ${currentResults.inputs.profundidadeInstalacao} m
- Desnível Vertical (DV): ${currentResults.inputs.desnivelVertical} m
- Distância Horizontal (DH): ${currentResults.inputs.distanciaHorizontal} m
- Perda de Carga Estimada (PC%): ${currentResults.inputs.perdaCarga}%

PASSO A PASSO DO CÁLCULO:
1. Altura Geométrica (HG):
   HG = ND + DV = ${currentResults.inputs.nivelDinamico} + ${currentResults.inputs.desnivelVertical} = ${currentResults.intermediate.alturaGeometrica} m

2. Comprimento da Tubulação (CT):
   CT = PI + DV + DH = ${currentResults.inputs.profundidadeInstalacao} + ${currentResults.inputs.desnivelVertical} + ${currentResults.inputs.distanciaHorizontal} = ${currentResults.outputs.comprimentoDaTubulacao} m

3. Perda de Carga (PC) - Estimada em ${currentResults.inputs.perdaCarga}%:
   PC = CT * ${(currentResults.inputs.perdaCarga / 100).toFixed(2)} = ${currentResults.outputs.comprimentoDaTubulacao} * ${(currentResults.inputs.perdaCarga / 100).toFixed(2)} = ${currentResults.intermediate.perdaDeCarga.toFixed(2)} m

4. Altura Manométrica Total (AMT/MCA):
   AMT = HG + PC = ${currentResults.intermediate.alturaGeometrica} + ${currentResults.intermediate.perdaDeCarga.toFixed(2)} = ${currentResults.outputs.mca.toFixed(2)} m
   (Valor arredondado para exibição: ${currentResults.outputs.mcaDisplay} m.c.a.)

 5. Potência de Projeto (P):
   Fórmula: P(cv) = (Q * AMT) / (270 * Rendimento)
   P = (${currentResults.inputs.vazao} * ${currentResults.outputs.mca.toFixed(2)}) / (270 * ${currentResults.inputs.rendimento}) = ${currentResults.intermediate.potenciaCalculada.toFixed(2)} cv

 6. Cabo Elétrico Sugerido (Motor a Painel ≈ ${currentResults.outputs.comprimentoBombaPainel} m):
    - Rede ${currentResults.inputs.tensao}: ${currentResults.outputs.bitolaEspecifica} mm²
    (Cálculo considera Queda de Tensão máx de 4%, FP 0.8 e N 0.65)

 ${currentResults.outputs.bombaRecomendada ? `7. SUGESTÃO DE EQUIPAMENTO (Fabricante Leão):
    - Modelo da Bomba: ${currentResults.outputs.bombaRecomendada.modelo}
    - Potência Mínima Exigida: ${currentResults.outputs.bombaRecomendada.potencia_cv} cv
    (Sugestão automática baseada no catálogo comercial onde H(max) atende MCA calculado)` : ''}

RESULTADOS FINAIS:
- Altura Manométrica Total: ${currentResults.outputs.mcaDisplay} m.c.a.
- Potência Recomendada: ${currentResults.outputs.potenciaRecomendada} cv
- Tubulação Sugerida: ${currentResults.outputs.diametroH}
${currentResults.outputs.bombaRecomendada ? `- Bomba Ideal Cruzada: ${currentResults.outputs.bombaRecomendada.modelo} (${currentResults.outputs.bombaRecomendada.potencia_cv} cv)` : ''}
- Extensão Total da Tubulação: ${currentResults.outputs.comprimentoDaTubulacao.toFixed(1).replace('.', ',')} metros

-------------------------------------------
NOTAS TÉCNICAS:
- Rendimento do conjunto motor-bomba considerado: ${(currentResults.inputs.rendimento * 100).toFixed(0)}%.
- A perda de carga de ${currentResults.inputs.perdaCarga}% é definida pelo usuário para estimativas.
- Recomenda-se validar com as tabelas de perda de carga do fabricante dos tubos.
- Este documento é apenas uma estimativa.

-------------------------------------------
Gerado por HydroCalc Pro
`.trim();

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Memorial_Calculo_Bomba_${new Date().getTime()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Animação dos inputs para foco suave
    const inputs = document.querySelectorAll('.input-field input, .input-field select');
    inputs.forEach(input => {
        // Inicializar se tiver valor
        if (input.value) input.classList.add('has-value');

        // Toggle class on change/input for select
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', () => {
                if (input.value) input.classList.add('has-value');
                else input.classList.remove('has-value');
            });
        }

        // Prevenir tooltip ao clicar no label se quiser dar foco
        const label = input.nextElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.addEventListener('click', () => input.focus());
        }
    });
});
