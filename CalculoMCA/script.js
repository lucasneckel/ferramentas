document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calc-form');
    const resultsContainer = document.getElementById('results');
    const downloadBtn = document.getElementById('download-txt');

    let currentResults = null;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Obter os valores de entrada
        const vazaoStr = document.getElementById('vazao').value;
        const nivelDinamicoStr = document.getElementById('nivelDinamico').value;
        const desnivelVerticalStr = document.getElementById('desnivelVertical').value;
        const distanciaHorizontalStr = document.getElementById('distanciaHorizontal').value;

        // Converter para float (substituindo vírgula caso o usuário digite no navegador)
        const vazao = parseFloat(vazaoStr.replace(',', '.'));
        const nivelDinamico = parseFloat(nivelDinamicoStr.replace(',', '.'));
        const desnivelVertical = parseFloat(desnivelVerticalStr.replace(',', '.'));
        const distanciaHorizontal = parseFloat(distanciaHorizontalStr.replace(',', '.'));

        if (isNaN(vazao) || isNaN(nivelDinamico) || isNaN(desnivelVertical) || isNaN(distanciaHorizontal)) {
            alert('Por favor, preencha todos os campos corretamente com números.');
            return;
        }

        // 1. Cálculo da Altura Manométrica Total (MCA)
        const alturaGeometrica = nivelDinamico + desnivelVertical;
        const comprimentoDaTubulacao = nivelDinamico + desnivelVertical + distanciaHorizontal;
        
        // Estimativa de perda de carga (5% do comprimento total)
        // A perda de carga ocorre tanto na edutora quanto na adutora
        const perdaDeCarga = comprimentoDaTubulacao * 0.05;
        
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
        // Rendimento médio adotado = 0.5 (50%)
        const potenciaCalculada = (vazao * mca) / (270 * 0.5);
        
        // Arredondar para potência comercial superior
        const potenciasComerciais = [0.33, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 7.5, 10.0, 12.5, 15.0, 20.0, 25.0, 30.0];
        let potenciaRecomendada = potenciasComerciais[potenciasComerciais.length - 1]; // Fallback para a maior
        
        for (let i = 0; i < potenciasComerciais.length; i++) {
            if (potenciaCalculada <= potenciasComerciais[i]) {
                potenciaRecomendada = potenciasComerciais[i];
                break;
            }
        }

        // Armazenar resultados para o memorial
        currentResults = {
            inputs: { vazao, nivelDinamico, desnivelVertical, distanciaHorizontal },
            intermediate: { alturaGeometrica, perdaDeCarga, potenciaCalculada },
            outputs: { mcaDisplay, potenciaRecomendada, diametroH, comprimentoDaTubulacao, mca }
        };

        // Formatar e Exibir resultados
        document.getElementById('res-mca').textContent = `${mcaDisplay} m.c.a.`;
        document.getElementById('res-potencia').textContent = `${potenciaRecomendada} cv`;
        document.getElementById('res-diametro').textContent = diametroH;
        document.getElementById('res-comprimento').textContent = comprimentoDaTubulacao.toFixed(1).replace('.', ',');

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
- Desnível Vertical (DV): ${currentResults.inputs.desnivelVertical} m
- Distância Horizontal (DH): ${currentResults.inputs.distanciaHorizontal} m

PASSO A PASSO DO CÁLCULO:
1. Altura Geométrica (HG):
   HG = ND + DV = ${currentResults.inputs.nivelDinamico} + ${currentResults.inputs.desnivelVertical} = ${currentResults.intermediate.alturaGeometrica} m

2. Comprimento da Tubulação (CT):
   CT = HG + DH = ${currentResults.intermediate.alturaGeometrica} + ${currentResults.inputs.distanciaHorizontal} = ${currentResults.outputs.comprimentoDaTubulacao} m

3. Perda de Carga (PC) - Estimada em 5%:
   PC = CT * 0.05 = ${currentResults.outputs.comprimentoDaTubulacao} * 0.05 = ${currentResults.intermediate.perdaDeCarga.toFixed(2)} m

4. Altura Manométrica Total (AMT/MCA):
   AMT = HG + PC = ${currentResults.intermediate.alturaGeometrica} + ${currentResults.intermediate.perdaDeCarga.toFixed(2)} = ${currentResults.outputs.mca.toFixed(2)} m
   (Valor arredondado para exibição: ${currentResults.outputs.mcaDisplay} m.c.a.)

5. Potência de Projeto (P):
   Fórmula: P(cv) = (Q * AMT) / (270 * Rendimento)
   P = (${currentResults.inputs.vazao} * ${currentResults.outputs.mca.toFixed(2)}) / (270 * 0.5) = ${currentResults.intermediate.potenciaCalculada.toFixed(2)} cv

RESULTADOS FINAIS:
- Altura Manométrica Total: ${currentResults.outputs.mcaDisplay} m.c.a.
- Potência Comercial Recomendada: ${currentResults.outputs.potenciaRecomendada} cv
- Diâmetro da Tubulação Sugerido: ${currentResults.outputs.diametroH}
- Extensão Total da Tubulação: ${currentResults.outputs.comprimentoDaTubulacao.toFixed(1).replace('.', ',')} metros

-------------------------------------------
NOTAS TÉCNICAS:
- Rendimento do conjunto motor-bomba considerado: 50%.
- A perda de carga de 5% é uma simplificação para estimativas rápidas.
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
    const inputs = document.querySelectorAll('.input-field input');
    inputs.forEach(input => {
        // Prevenir tooltip ao clicar no label se quiser dar foco
        const label = input.nextElementSibling;
        if(label && label.tagName === 'LABEL') {
            label.addEventListener('click', () => input.focus());
        }
    });
});
