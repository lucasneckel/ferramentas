// script.js - Lógica de Dimensionamento NBR 5410

// 1. Dicionários e Tabelas (Valores Simplificados/Referenciais NBR 5410)

// Fator de Correção de Temperatura (FCT) - Ambiente
const fctTable = {
    // PVC (70°C)
    "PVC": {
        "10": 1.22, "15": 1.17, "20": 1.12, "25": 1.06, "30": 1.00,
        "35": 0.94, "40": 0.87, "45": 0.79, "50": 0.71, "55": 0.61,
        "60": 0.50, "65": 0.00, "70": 0.00, "75": 0.00, "80": 0.00
    },
    // EPR/XLPE (90°C)
    "EPR": {
        "10": 1.15, "15": 1.12, "20": 1.08, "25": 1.04, "30": 1.00,
        "35": 0.96, "40": 0.91, "45": 0.87, "50": 0.82, "55": 0.76,
        "60": 0.71, "65": 0.65, "70": 0.58, "75": 0.50, "80": 0.41
    }
};

// Fator de Correção de Agrupamento (FCA) - Tabela 42 Simplificada
const fcaTable = {
    "1": { "1": 1.0, "2": 0.80, "3": 0.70, "4": 0.65, "5": 0.60, "6": 0.57, "7": 0.54, "8": 0.52, "9-11": 0.50, "12-15": 0.45, "16-19": 0.41, "20-": 0.38 },
    "2": { "1": 1.0, "2": 0.85, "3": 0.79, "4": 0.75, "5": 0.73, "6": 0.72, "7": 0.71, "8": 0.70, "9-11": 0.70, "12-15": 0.70, "16-19": 0.70, "20-": 0.70 },
    "3": { "1": 1.0, "2": 0.88, "3": 0.82, "4": 0.77, "5": 0.75, "6": 0.73, "7": 0.73, "8": 0.72, "9-11": 0.72, "12-15": 0.72, "16-19": 0.72, "20-": 0.72 }
};

// Capacidade de Condução de Corrente Iz (A) para Cobre, Tabela 36 (PVC) e 37 (EPR)
const izCobrePVC_B1 = {
    1.5: [17.5, 15.5], 2.5: [24, 21], 4: [32, 28], 6: [41, 36], 10: [57, 50],
    16: [76, 68], 25: [101, 89], 35: [125, 111], 50: [151, 134], 70: [192, 171]
};

const izCobreEPR_B1 = {
    1.5: [22, 19.5], 2.5: [30, 26], 4: [40, 35], 6: [51, 44], 10: [71, 62],
    16: [96, 84], 25: [127, 112], 35: [157, 138], 50: [190, 167], 70: [242, 214]
};

// Capacidade de Condução de Corrente Iz (A) para Alumínio, Tabela 38 (PVC) e 39 (EPR) - simplificada para condutores >= 16mm² (NBR 5410 - Alumínio é permitido a partir de 16mm² no mínimo para instalações fixas em geral)
const izAluminioPVC_B1 = {
    16: [59, 53], 25: [77, 69], 35: [96, 86], 50: [117, 104], 70: [149, 133], 95: [180, 161], 120: [208, 186], 150: [236, 211]
};

const izAluminioEPR_B1 = {
    16: [73, 64], 25: [98, 87], 35: [122, 108], 50: [149, 132], 70: [192, 170], 95: [235, 207], 120: [273, 240], 150: [316, 277]
};

// Fator k para Curto Circuito (Cobre e Alumínio)
const fatorK = {
    "cobre": { "PVC": 115, "EPR": 143 },
    "aluminio": { "PVC": 76, "EPR": 94 }
};

// Resistividade do Cobre e Alumínio (ohms.mm²/m) - quente aprox. (Considerando temp trab)
const resistividade = {
    "cobre": 0.0225,
    "aluminio": 0.0360
};

// Seções Comerciais (mm²)
const secoesComerciais = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150];

// Correntes Nominais Comerciais de Disjuntores DIN (A)
const disjuntoresComerciais = [2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];

// Array Global para Manter o Quadro de Cargas
let circuitosQuadro = [];

// --- Tabelas de Demanda GED-13 CPFL ---

// Tabela 3 - Iluminação e Tomadas (Residencial)
// Potência Instalada (kW) -> Fator de Demanda
const fdTabela3 = [
    { limite: 1, fd: 0.86 },
    { limite: 2, fd: 0.75 },
    { limite: 3, fd: 0.66 },
    { limite: 4, fd: 0.59 },
    { limite: 5, fd: 0.52 },
    { limite: 6, fd: 0.48 },
    { limite: 7, fd: 0.45 },
    { limite: 8, fd: 0.42 },
    { limite: 9, fd: 0.40 },
    { limite: 10, fd: 0.38 },
    { limite: Infinity, fd: 0.35 }
];

// Tabela 4 - Chuveiros, Torneiras, Aquecedores (Qtd -> Fator)
const fdTabela4 = {
    1: 1.00, 2: 1.00, 3: 0.84, 4: 0.76, 5: 0.70, 6: 0.65, 7: 0.60, 8: 0.56, 9: 0.52, 10: 0.49,
    11: 0.47, 12: 0.45, 13: 0.44, 14: 0.43, 15: 0.42, 16: 0.41, 17: 0.40, 18: 0.39, 19: 0.38, 20: 0.37,
    21: 0.36, 22: 0.35, 23: 0.34, 24: 0.33, 25: 0.32, "default": 0.30
};

// Tabela 6 - Secadora, Forno, MLouça, Micro-ondas (Qtd -> Fator)
const fdTabela6 = {
    1: 1.00, 2: 0.70, 3: 0.70, 4: 0.70, 5: 0.60, 6: 0.60, 7: 0.50, 8: 0.50, "default": 0.50
};

// Tabela 7 - Fogão Elétrico (Qtd -> Fator)
const fdTabela7 = {
    1: 1.00, 2: 0.60, 3: 0.48, 4: 0.40, 5: 0.37, 6: 0.35, 7: 0.33, 8: 0.32, 9: 0.31, 10: 0.30,
    11: 0.30, 12: 0.28, 13: 0.28, 14: 0.28, 15: 0.28, 16: 0.26, "default": 0.26
};

// Tabela 9 - Ar Condicionado Janela (Qtd -> Fator)
const fdTabela9 = {
    1: 1.00, 2: 1.00, 3: 1.00, 4: 1.00, 5: 1.00, 6: 1.00, 7: 1.00, 8: 1.00, 9: 1.00, 10: 1.00,
    11: 0.90, 12: 0.90, 13: 0.90, 14: 0.90, 15: 0.90, 16: 0.90, 17: 0.90, 18: 0.90, 19: 0.90, 20: 0.90,
    21: 0.82, 22: 0.82, 23: 0.82, 24: 0.82, 25: 0.82, "default": 0.75
};

// Tabela 10 - Motores (Qtd -> Fator)
const fdTabela10 = {
    1: 1.00, 2: 0.90, 3: 0.80, 4: 0.80, 5: 0.70, "default": 0.70
};

// 2. Elementos DOM
const elements = {
    potencia: document.getElementById('potencia'),
    unidadePotencia: document.getElementById('unidade-potencia'),
    fatorPotencia: document.getElementById('fator-potencia'),
    fases: document.getElementById('fases'),
    tensao: document.getElementById('tensao'),
    potenciaAparente: document.getElementById('potencia-aparente'),
    correnteProjeto: document.getElementById('corrente-projeto'),
    isolacao: document.getElementById('isolacao'),
    temperatura: document.getElementById('temperatura'),
    material: document.getElementById('material'),
    fcTemperatura: document.getElementById('fc-temperatura'),
    circuitosAgrupados: document.getElementById('circuitos-agrupados'),
    formaAgrupamento: document.getElementById('forma-agrupamento'),
    fcAgrupamento: document.getElementById('fc-agrupamento'),
    correnteAjustada: document.getElementById('corrente-ajustada'),
    tipoCircuito: document.getElementById('tipo-circuito'),
    condutoresCarregados: document.getElementById('condutores-carregados'),
    metodoInstalacao: document.getElementById('metodo-instalacao'),
    comprimento: document.getElementById('comprimento'),
    maxQueda: document.getElementById('max-queda'),
    considerarCurto: document.getElementById('considerar-curto'),
    groupDuracaoCc: document.getElementById('group-duracao-cc'),
    groupIcc: document.getElementById('group-icc'),
    duracaoCc: document.getElementById('duracao-cc'),
    icc: document.getElementById('icc'),
    btnCalcular: document.getElementById('btn-calcular'),
    resultados: document.getElementById('resultados'),
    resMin: document.getElementById('res-min'),
    resConducao: document.getElementById('res-conducao'),
    resQueda: document.getElementById('res-queda'),
    resCurto: document.getElementById('res-curto'),
    resAdotada: document.getElementById('res-adotada'),
    resDetalhes: document.getElementById('res-detalhes'),
    resDisjuntor: document.getElementById('res-disjuntor'),
    resDisjuntorDetalhes: document.getElementById('res-disjuntor-detalhes'),
    nomeCircuito: document.getElementById('nome-circuito'),
    nomeProjeto: document.getElementById('nome-projeto'),
    numCircuito: document.getElementById('num-circuito'),
    classeDemanda: document.getElementById('classe-demanda'),
    btnMemorial: document.getElementById('btn-memorial'),

    // Quadro e Projeto
    btnNovoProjeto: document.getElementById('btn-novo-projeto'),
    btnSalvarProjeto: document.getElementById('btn-salvar-projeto'),
    inputAbrirProjeto: document.getElementById('input-abrir-projeto'),
    btnAdicionarQuadro: document.getElementById('btn-adicionar-quadro'),
    tbodyQuadro: document.getElementById('tbody-quadro'),
    quadroVazio: document.getElementById('quadro-vazio'),
    tabelaQuadro: document.getElementById('tabela-quadro'),
    btnExportarQuadro: document.getElementById('btn-exportar-quadro'),
    btnCalcularDemanda: document.getElementById('id-btn-calcular-demanda'),
    containerResultadosDemanda: document.getElementById('container-resultados-demanda'),
    resPotInstaladaTotal: document.getElementById('res-pot-instalada-total'),
    resDemandaTotal: document.getElementById('res-demanda-total'),
    detalhesDemandaClasses: document.getElementById('detalhes-demanda-classes'),

    // Modal
    btnInfoMetodo: document.getElementById('btn-info-metodo'),
    modalMetodos: document.getElementById('modal-metodos'),
    btnCloseModal: document.getElementById('btn-close-modal')
};

// 3. Funções de Cálculo Intermediário

function updateDynamicValues() {
    // a) Potência Aparente (VA)
    let potVal = parseFloat(elements.potencia.value) || 0;
    let fp = parseFloat(elements.fatorPotencia.value) || 0.91;
    let uni = elements.unidadePotencia.value;

    let w = 0;
    if (uni === 'W') w = potVal;
    if (uni === 'kW') w = potVal * 1000;
    if (uni === 'CV') w = potVal * 736;
    if (uni === 'HP') w = potVal * 746;

    let va = fp > 0 ? (w / fp) : 0;
    elements.potenciaAparente.value = va.toFixed(2);

    // b) Corrente de Projeto (Ib)
    let fases = elements.fases.value; // "1" mono, "2" bi, "3" tri
    let sistTensao = elements.tensao.value; // "127" ou "220"

    let vLinha = sistTensao === "127" ? 220 : 380;
    let vFase = sistTensao === "127" ? 127 : 220;

    let ib = 0;
    if (fases === "1") {
        ib = va / vFase;
    } else if (fases === "2") {
        ib = va / vLinha;
    } else if (fases === "3") {
        ib = va / (vLinha * Math.sqrt(3));
    }
    elements.correnteProjeto.value = ib.toFixed(2);

    // c) FCT
    let iso = elements.isolacao.value;
    let temp = elements.temperatura.value;
    let fct = fctTable[iso][temp] || 1.0;
    elements.fcTemperatura.value = fct.toFixed(2);

    // d) FCA
    let agrup = elements.formaAgrupamento.value; // 1, 2, 3
    let circs = elements.circuitosAgrupados.value; // "1", "2"... "20-"
    let fca = fcaTable[agrup][circs] || 1.0;
    elements.fcAgrupamento.value = fca.toFixed(2);

    // e) Corrente Ajustada
    let id_ajustada = fct * fca > 0 ? (ib / (fct * fca)) : 0;
    elements.correnteAjustada.value = id_ajustada.toFixed(2);
}

// 4. Lógica de Dimensionamento Principal (Ao clicar)

function calcularSecao() {
    // Garantir que dinâmicos estão atualizados
    updateDynamicValues();

    let ibLines = parseFloat(elements.correnteProjeto.value);
    let ibAjust = parseFloat(elements.correnteAjustada.value);
    let mat = elements.material.value; // "cobre" ou "aluminio"

    // --- Critério 1: Seção Mínima ---
    let secMin = 0;
    if (mat === "aluminio") {
        // NBR 5410: Condutores de alumínio devem ter seção mínima de 16 mm² (regra geral pra instalações fixas/cabos energia)
        secMin = 16;
    } else {
        secMin = elements.tipoCircuito.value === "iluminacao" ? 1.5 : 2.5;
    }
    elements.resMin.textContent = secMin + " mm²";

    // --- Critério 2: Capacidade de Condução Corrente ---
    let secCond = 0;
    let maxIz = 0;
    let iso = elements.isolacao.value;
    let condCarr = elements.condutoresCarregados.value === "2" ? 0 : 1; // index 0 (2 cond), 1 (3 cond)

    let tabelaAlvo = null;
    if (mat === "cobre") {
        tabelaAlvo = iso === "PVC" ? izCobrePVC_B1 : izCobreEPR_B1;
    } else {
        tabelaAlvo = iso === "PVC" ? izAluminioPVC_B1 : izAluminioEPR_B1;
    }

    for (let s of secoesComerciais) {
        if (mat === "aluminio" && s < 16) continue; // Pula seções < 16 p/ Alumínio

        if (tabelaAlvo[s]) {
            let iz = tabelaAlvo[s][condCarr];
            if (iz >= ibAjust) {
                secCond = s;
                maxIz = iz;
                break;
            }
        }
    }
    if (secCond === 0) secCond = 150; // fallback se estourou a tabela pequena
    elements.resConducao.textContent = secCond + " mm²";

    // --- Critério 3: Queda de Tensão ---
    let comp = parseFloat(elements.comprimento.value) || 10;
    let maxQPerc = parseFloat(elements.maxQueda.value) || 4; // 2 ou 4%

    let sistTensao = elements.tensao.value;
    let vFase = sistTensao === "127" ? 127 : 220;
    let vLinha = sistTensao === "127" ? 220 : 380;
    let eMax = (maxQPerc / 100) * (elements.fases.value === "1" ? vFase : vLinha);
    let rho = resistividade[mat];

    // Delta U calc: Monofásico/Bifásico: 2 * R * L * I. Trifásico: sqrt(3) * R * L * I
    let secQueda = 0;
    if (elements.fases.value === "3") {
        secQueda = (Math.sqrt(3) * rho * comp * ibLines) / eMax;
    } else {
        // Mono e Bi
        secQueda = (2 * rho * comp * ibLines) / eMax;
    }

    // Achar sec comercial imediat. superior e compatível com material
    let secQuedaComercial = secoesComerciais.find(s => s >= secQueda && !(mat === "aluminio" && s < 16)) || 150;
    elements.resQueda.textContent = secQuedaComercial + " mm²";

    // --- Critério 4: Curto Circuito ---
    let adoptCurto = elements.considerarCurto.value === "sim";
    let iccVal = parseFloat(elements.icc.value) * 1000; // de kA para A
    let tMs = parseFloat(elements.duracaoCc.value) / 1000; // de ms para s
    let kVal = fatorK[mat][iso];

    let secCurtoCalc = (iccVal * Math.sqrt(tMs)) / kVal;
    let secCurtoComercial = adoptCurto ? (secoesComerciais.find(s => s >= secCurtoCalc && !(mat === "aluminio" && s < 16)) || 150) : 0;
    elements.resCurto.textContent = adoptCurto ? (secCurtoComercial + " mm²") : "Desconsiderado";

    // --- Seção Adotada (Maior de todos)
    let adotada = Math.max(secMin, secCond, secQuedaComercial, secCurtoComercial);

    // Recalcular a queda real com a seção adotada para exibir
    let quedaRealV = 0;
    if (elements.fases.value === "3") {
        quedaRealV = (Math.sqrt(3) * rho * comp * ibLines) / adotada;
    } else {
        quedaRealV = (2 * rho * comp * ibLines) / adotada;
    }
    let quedaRealPerc = (quedaRealV / (elements.fases.value === "1" ? vFase : vLinha)) * 100;

    // Exibição Final
    let nomeMaterial = mat === "aluminio" ? "Alumínio" : "Cobre";
    elements.resAdotada.innerHTML = adotada + " mm² <span>(Material: " + nomeMaterial + ")</span>";
    elements.resDetalhes.textContent = `Iz Cabo: ${maxIz} A | Queda Tensão: ${quedaRealPerc.toFixed(2)} % | Ib': ${ibAjust.toFixed(2)} A`;

    // Mostrar container
    elements.resultados.classList.remove('hidden');

    // --- RECOMENDAÇÃO DE DISJUNTOR DIN ---
    // Regra NBR 5410: Ib <= In <= Iz
    let ib = parseFloat(elements.correnteProjeto.value);

    // Procura o menor disjuntor comercial que seja maior ou igual a Ib e menor ou igual a maxIz
    let disjuntorIn = 0;
    for (let in_comercial of disjuntoresComerciais) {
        if (in_comercial >= ib && in_comercial <= maxIz) {
            disjuntorIn = in_comercial;
            break;
        }
    }

    // Tratativa de erro se não achar disjuntor na faixa
    let msgDisjuntor = disjuntorIn > 0 ? `${disjuntorIn} A` : "Sobredimensionar!";

    // Polos (Monopolar, Bipolar, Tripolar)
    let fVal = elements.fases.value;
    let polos = "Monopolar";
    if (fVal === "2") polos = "Bipolar";
    if (fVal === "3") polos = "Tripolar";

    // Curva do Disjuntor (B ou C) baseada no nome/tipo de circuito
    let nomeLowerCase = elements.nomeCircuito.value.toLowerCase();
    let curvaRecomendada = "C"; // Padrão cargas gerais/força/motores
    // Curva B: Cargas puramente resistivas (chuveiro, aquecedor) ou circuitos longos
    if (
        nomeLowerCase.includes("chuveiro") ||
        nomeLowerCase.includes("aquecedor") ||
        nomeLowerCase.includes("resist") ||
        nomeLowerCase.includes("torneira")
    ) {
        curvaRecomendada = "B";
    }

    // Capacidade de curto-circuito recomendada com base no Icc inserido pelo usuário 
    // Em DIN, kA comerciais padrão: 3kA, 4.5kA, 6kA e 10kA (residencial/terciário)
    let iccReq = parseFloat(elements.icc.value);
    let iccDisj = 3.0; // Padrão min norma p/ DIN
    if (iccReq > 3.0 && iccReq <= 4.5) iccDisj = 4.5;
    else if (iccReq > 4.5 && iccReq <= 6.0) iccDisj = 6.0;
    else if (iccReq > 6.0 && iccReq <= 10.0) iccDisj = 10.0;
    else if (iccReq > 10.0) iccDisj = Math.ceil(iccReq); // Valores atípicos para DIN pequeno.

    elements.resDisjuntor.innerHTML = `${msgDisjuntor} <span>(Curva ${curvaRecomendada}, ${polos})</span>`;
    elements.resDisjuntorDetalhes.textContent = `Capacidade de Curto-Circuito Recomendada: ≥ ${iccDisj} kA`;
}

// 5. Gestão do Quadro de Cargas
function atualizarTabelaQuadro() {
    elements.tbodyQuadro.innerHTML = "";

    if (circuitosQuadro.length === 0) {
        elements.quadroVazio.classList.remove('hidden');
        elements.tabelaQuadro.classList.add('hidden');
        elements.btnExportarQuadro.style.display = 'none';
        return;
    }

    elements.quadroVazio.classList.add('hidden');
    elements.tabelaQuadro.classList.remove('hidden');
    elements.btnExportarQuadro.style.display = 'inline-block';

    circuitosQuadro.forEach((circ, index) => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${circ.numero}</td>
            <td>${circ.nome}</td>
            <td>${circ.tensao}</td>
            <td>${circ.fases}</td>
            <td>${circ.potenciaVA}</td>
            <td>${circ.ib}</td>
            <td><strong>${circ.cabo}</strong> (${circ.material === "Alumínio" ? "Al" : "Cu"})</td>
            <td><strong>${circ.disjuntorCompleto}</strong></td>
            <td><button class="btn-delete" onclick="removerCircuito(${index})" title="Excluir Circuito">🗑️</button></td>
        `;
        elements.tbodyQuadro.appendChild(tr);
    });

    elements.btnCalcularDemanda.style.display = 'inline-block';
}

function adicionarAoQuadro() {
    // Só deixa adicionar se já calculou
    if (elements.resultados.classList.contains('hidden')) {
        alert("Calcule a seção do condutor antes de adicionar ao quadro!");
        return;
    }

    let potVal = parseFloat(elements.potencia.value) || 0;
    let uni = elements.unidadePotencia.value;
    let w = uni === 'W' ? potVal : (uni === 'kW' ? potVal * 1000 : (uni === 'CV' ? potVal * 736 : potVal * 746));

    let novoCircuito = {
        numero: elements.numCircuito.value || (circuitosQuadro.length + 1).toString(),
        nome: elements.nomeCircuito.value || `Circuito ${circuitosQuadro.length + 1}`,
        classeDemanda: elements.classeDemanda.options[elements.classeDemanda.selectedIndex].text,
        classeDemandaRaw: elements.classeDemanda.value,
        potenciaW: w.toFixed(2),
        fatorPotencia: elements.fatorPotencia.value,
        potenciaVA: elements.potenciaAparente.value,
        ib: elements.correnteProjeto.value,
        condutoresCarregados: elements.condutoresCarregados.value,
        circuitosAgrupados: elements.circuitosAgrupados.value,
        fcTemp: elements.fcTemperatura.value,
        fcAgrup: elements.fcAgrupamento.value,
        ibAjust: elements.correnteAjustada.value,
        comprimento: elements.comprimento.value,
        quedaTensao: elements.resDetalhes.textContent.match(/Queda Tensão: (.*?) %/)[1],
        cabo: elements.resAdotada.textContent.split(" ")[0],
        isolacao: elements.isolacao.value,
        material: elements.material.value === "aluminio" ? "Alumínio" : "Cobre",
        disjuntorIn: elements.resDisjuntor.textContent.split(" ")[0],
        classe: elements.resDisjuntor.textContent.match(/Curva (B|C)/) ? elements.resDisjuntor.textContent.match(/Curva (B|C)/)[1] : "C",
        polos: elements.resDisjuntor.textContent.match(/\((.*?), (.*?)\)/)[2],
        icc: elements.resDisjuntorDetalhes.textContent.match(/≥ (.*?) kA/)[1],
        // Mantendo campos antigos para compatibilidade com a tabela visual se necessário, 
        // mas o CSV usará a estrutura nova.
        tensao: elements.tensao.options[elements.tensao.selectedIndex].text,
        fases: elements.fases.options[elements.fases.selectedIndex].text,
        disjuntorCompleto: elements.resDisjuntor.textContent.split(" ")[0] + "A " + elements.resDisjuntor.textContent.match(/\((.*?)\)/)[1].split(",")[0]
    };

    circuitosQuadro.push(novoCircuito);
    atualizarTabelaQuadro();

    // Auto-incrementar form
    let nextNum = parseInt(novoCircuito.numero);
    if (!isNaN(nextNum)) elements.numCircuito.value = nextNum + 1;
    elements.nomeCircuito.value = "";
    elements.potencia.value = 0;
    updateDynamicValues();
    elements.resultados.classList.add('hidden');
}

// A função precisa ser global pro onclick no HTML string funcionar
window.removerCircuito = function (index) {
    if (confirm("Tem certeza que deseja remover este circuito do quadro?")) {
        circuitosQuadro.splice(index, 1);
        atualizarTabelaQuadro();
    }
}

// 6. Persistência de Dados (JSON / Abrir e Salvar Projeto)
function novoProjeto() {
    if (circuitosQuadro.length > 0) {
        if (!confirm("Isso apagará o quadro de cargas atual não salvo. Deseja continuar?")) return;
    }
    elements.nomeProjeto.value = "";
    circuitosQuadro = [];
    atualizarTabelaQuadro();
    elements.numCircuito.value = "1";
    elements.nomeCircuito.value = "";
    elements.potencia.value = 0;
    elements.resultados.classList.add('hidden');
    updateDynamicValues();
}

function salvarProjeto() {
    if (circuitosQuadro.length === 0 && !elements.nomeProjeto.value) {
        alert("Não há dados no projeto para salvar.");
        return;
    }

    let dadosProjeto = {
        nomeApp: "Dimensionamento_Condutores_NBR5410",
        data: new Date().toISOString(),
        projeto: elements.nomeProjeto.value || "Projeto_Sem_Nome",
        circuitos: circuitosQuadro
    };

    let blob = new Blob([JSON.stringify(dadosProjeto, null, 2)], { type: "application/json" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    let nomeArquivo = `Projeto_${(elements.nomeProjeto.value || "Eletrico").replace(/\\s+/g, '_')}.json`;
    link.download = nomeArquivo;
    link.click();
}

function abrirProjeto(evento) {
    let file = evento.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function (e) {
        try {
            let dadosProjeto = JSON.parse(e.target.result);
            if (dadosProjeto.nomeApp !== "Dimensionamento_Condutores_NBR5410") {
                alert("Arquivo inválido. O arquivo JSON não pertence a este aplicativo.");
                return;
            }

            elements.nomeProjeto.value = dadosProjeto.projeto || "";
            circuitosQuadro = dadosProjeto.circuitos || [];
            atualizarTabelaQuadro();
            alert("Projeto carregado com sucesso!");
        } catch (err) {
            alert("Erro ao ler o arquivo selecionado. Verifique se o formato está correto.");
        }
    };
    reader.readAsText(file);
    // Limpa o input pra permitir re-importar o mesmo arquivo se quiser
    evento.target.value = "";
}

// 7. Exportar Quadro CSV
function exportarQuadroCSV() {
    if (circuitosQuadro.length === 0) return;

    // Cabeçalho conforme solicitado
    let csv = "Circuito;Descrição;Classe de Demanda;Potência(W);Cos Phi;Potência(VA);I_proj(A);Cond. Carr.;Núm. Circuitos Agrup;FC Temp;FC Agrup;I_proj_ajust(A);Compr.(m);Delta_V(%);Condutor(mm2);Isolação;Material;Disjuntor(A);Classe;Polos;Capac. CC(kA)\n";

    circuitosQuadro.forEach(c => {
        csv += `${c.numero};${c.nome};${c.classeDemanda};${c.potenciaW};${c.fatorPotencia};${c.potenciaVA};${c.ib};${c.condutoresCarregados};${c.circuitosAgrupados};${c.fcTemp};${c.fcAgrup};${c.ibAjust};${c.comprimento};${c.quedaTensao};${c.cabo};${c.isolacao};${c.material};${c.disjuntorIn};${c.classe};${c.polos};${c.icc}\n`;
    });

    let blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Quadro_Cargas_${(elements.nomeProjeto.value || "Projeto").replace(/\s+/g, '_')}.csv`;
    link.click();
}

// 8. Cálculo de Demanda GED-13 (Quadro)
function calcularDemandaQuadro() {
    if (circuitosQuadro.length === 0) return;

    // Agrupadores por classe
    let grupos = {
        'a': { somaW: 0, qtd: 0, nome: 'Iluminação e Tomadas', unidade: 'kW' },
        'b': { somaW: 0, qtd: 0, nome: 'Aquecimento (Chuveiros, Torneiras, etc)', unidade: 'kW' },
        'c': { somaW: 0, qtd: 0, nome: 'Aquecedor Central/Acumulação', unidade: 'kW' },
        'd': { somaW: 0, qtd: 0, nome: 'Eletrodomésticos (Secadora, Forno, etc)', unidade: 'kW' },
        'e': { somaW: 0, qtd: 0, nome: 'Fogões Elétricos', unidade: 'kW' },
        'f': { somaW: 0, qtd: 0, nome: 'Ar Condicionado', unidade: 'kW' },
        'g': { somaW: 0, qtd: 0, nome: 'Motores', unidade: 'kW' },
        'h': { somaW: 0, qtd: 0, nome: 'Equipamentos Especiais', unidade: 'kW' },
        'i': { somaW: 0, qtd: 0, nome: 'Hidromassagem', unidade: 'kW' }
    };

    let potInstaladaTotalW = 0;

    // 1. Agrupar circuitos
    circuitosQuadro.forEach(c => {
        // Mapear letra da classe (primeiro caractere do valor do option)
        let classeKey = 'a'; // default if error
        if (c.classeDemandaRaw) {
            classeKey = c.classeDemandaRaw;
        } else {
            // Fallback: tentar descobrir pela descrição salva no objeto
            if (c.classeDemanda.includes("iluminação")) classeKey = 'a';
            else if (c.classeDemanda.includes("chuveiros")) classeKey = 'b';
            else if (c.classeDemanda.includes("central")) classeKey = 'c';
            else if (c.classeDemanda.includes("secadora")) classeKey = 'd';
            else if (c.classeDemanda.includes("fogões")) classeKey = 'e';
            else if (c.classeDemanda.includes("condicionador")) classeKey = 'f';
            else if (c.classeDemanda.includes("motores")) classeKey = 'g';
            else if (c.classeDemanda.includes("Especiais")) classeKey = 'h';
            else if (c.classeDemanda.includes("Hidromassagem")) classeKey = 'i';
        }

        let potW = parseFloat(c.potenciaW) || 0;
        grupos[classeKey].somaW += potW;
        grupos[classeKey].qtd += 1;
        potInstaladaTotalW += potW;
    });

    // 2. Aplicar Fatores de Demanda
    let demandaTotalVA = 0;
    let detalhesHtml = "<ul>";

    for (let k in grupos) {
        let g = grupos[k];
        if (g.qtd === 0) continue;

        let fd = 1.0;
        let pKW = g.somaW / 1000;

        if (k === 'a') {
            // Tabela 3 - Iluminação/Tomadas (Soma kW)
            let item = fdTabela3.find(i => pKW <= i.limite) || fdTabela3[fdTabela3.length - 1];
            fd = item.fd;
        } else if (k === 'b') {
            // Tabela 4 - Aquecimento (Qtd)
            fd = fdTabela4[g.qtd] || fdTabela4["default"];
        } else if (k === 'd') {
            // Tabela 6 - Eletrodomésticos (Qtd)
            fd = fdTabela6[g.qtd] || fdTabela6["default"];
        } else if (k === 'e') {
            // Tabela 7 - Fogões (Qtd)
            fd = fdTabela7[g.qtd] || fdTabela7["default"];
        } else if (k === 'f') {
            // Tabela 9 - Ar Condicionado (Qtd)
            fd = fdTabela9[g.qtd] || fdTabela9["default"];
        } else if (k === 'g') {
            // Tabela 10 - Motores (Qtd)
            fd = fdTabela10[g.qtd] || fdTabela10["default"];
        }
        // h, i, c permanecem com fd=1.0

        let dVA = g.somaW * fd; // Considerando FP=1 para demanda na soma final conforme GED-13
        demandaTotalVA += dVA;

        detalhesHtml += `<li><strong>Classe ${k}:</strong> ${g.nome} - Inst: ${pKW.toFixed(2)} kW | FD: ${fd.toFixed(2)} | Dem: ${(dVA/1000).toFixed(2)} kVA</li>`;
    }
    detalhesHtml += "</ul>";

    // 3. Exibir Resultados
    elements.resPotInstaladaTotal.textContent = (potInstaladaTotalW / 1000).toFixed(2) + " kW";
    elements.resDemandaTotal.textContent = (demandaTotalVA / 1000).toFixed(2) + " kVA";
    elements.detalhesDemandaClasses.innerHTML = detalhesHtml;
    elements.containerResultadosDemanda.classList.remove('hidden');
    
    // Rolar até o resultado
    elements.containerResultadosDemanda.scrollIntoView({ behavior: 'smooth' });
}

// 9. Geração de Memorial TXT (Atualizado com Quadro)
function gerarMemorialTxt() {
    let nome = elements.nomeCircuito.value || "Circuito_1";
    let data = new Date().toLocaleString("pt-BR");
    let nomeProj = elements.nomeProjeto.value || "Projeto N/D";

    let memorial = `=========================================================
MEMORIAL DE CÁLCULO ELÉTRICO - NBR 5410
=========================================================
Data: ${data}
Projeto: ${nomeProj}

`;

    if (circuitosQuadro.length > 0) {
        memorial += `=========================================================
QUADRO DE CARGAS RESUMO
=========================================================
Num | Nome                 | Tensao | Pot(VA) | Cabo | Disj.
---------------------------------------------------------
`;
        circuitosQuadro.forEach(c => {
            // PadStart/padEnd para criar a tabela de texto bonitinha
            let cNum = c.numero.toString().padEnd(3);
            let cNom = c.nome.substring(0, 20).padEnd(20);
            let cTen = c.tensao.substring(0, 6).padEnd(6);
            let cPot = c.potenciaVA.toString().padEnd(7);
            let cCab = (c.cabo + (c.material === "Alumínio" ? "Al" : "Cu")).padEnd(4);
            let cDis = c.disjuntorCompleto.padEnd(5);
            memorial += `${cNum} | ${cNom} | ${cTen} | ${cPot} | ${cCab} | ${cDis}\n`;
        });
        memorial += `---------------------------------------------------------\n\n`;
    }

    memorial += `=========================================================
CIRCUITO ATUAL EM TELA
=========================================================
Circuito: ${nome} (Número: ${document.getElementById('num-circuito').value || "1"})
Tipo de Circuito: ${elements.tipoCircuito.options[elements.tipoCircuito.selectedIndex].text}
Classe de Demanda: ${elements.classeDemanda.options[elements.classeDemanda.selectedIndex].text}

1. DADOS DE ENTRADA
---------------------------------------------------------
- Potência: ${elements.potencia.value} ${elements.unidadePotencia.value}
- Fator de Potência: ${elements.fatorPotencia.value}
- Fases: ${elements.fases.options[elements.fases.selectedIndex].text}
- Tensão: ${elements.tensao.options[elements.tensao.selectedIndex].text}
- Comprimento: ${elements.comprimento.value} m
- Material Escolhido: ${elements.material.options[elements.material.selectedIndex].text}
- Tipo de Isolação: ${elements.isolacao.options[elements.isolacao.selectedIndex].text}
- Método de Instalação: ${elements.metodoInstalacao.options[elements.metodoInstalacao.selectedIndex].text}
- Máxima Queda de Tensão: ${elements.maxQueda.value}%
- Corrente Curto-Circuito (Presumida): ${elements.icc.value} kA
- Duração Curto-Circuito: ${elements.duracaoCc.value} ms

2. DADOS INTERMEDIÁRIOS
---------------------------------------------------------
- Potência Aparente: ${elements.potenciaAparente.value} VA
- Corrente de Projeto (Ib): ${elements.correnteProjeto.value} A
- Fator de Correção Temp (FCT): ${elements.fcTemperatura.value}
- Fator de Correção Agrup. (FCA): ${elements.fcAgrupamento.value}
- Corrente Ajustada (Ib'): ${elements.correnteAjustada.value} A

3. DIMENSIONAMENTO DO CONDUTOR (Resultados Parciais)
---------------------------------------------------------
- Critério 1 (Seção Mínima): ${elements.resMin.textContent}
- Critério 2 (Capacidade Condução Iz): ${elements.resConducao.textContent}
- Critério 3 (Queda de Tensão): ${elements.resQueda.textContent}
- Critério 4 (Curto-Circuito): ${elements.resCurto.textContent}

4. RESULTADO FINAL
---------------------------------------------------------
CONDUTOR ADOTADO: ${elements.resAdotada.textContent}
(Detalhes: ${elements.resDetalhes.textContent})

DISJUNTOR DIN RECOMENDADO: ${elements.resDisjuntor.textContent}
(Detalhes: ${elements.resDisjuntorDetalhes.textContent})
=========================================================
Gerado via Aplicativo de Dimensionamento Web`;

    // Criação do arquivo e disparo de download
    let blob = new Blob([memorial], { type: "text/plain;charset=utf-8" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Memorial_${(nomeProj !== "Projeto N/D" ? nomeProj : nome).replace(/\\s+/g, '_')}.txt`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 9. Setup de Listeners
const inputsParaObservar = [
    elements.potencia, elements.unidadePotencia, elements.fatorPotencia,
    elements.fases, elements.tensao, elements.isolacao, elements.temperatura,
    elements.circuitosAgrupados, elements.formaAgrupamento, elements.material
];

inputsParaObservar.forEach(el => {
    el.addEventListener('input', updateDynamicValues);
    el.addEventListener('change', updateDynamicValues);
});

elements.btnCalcular.addEventListener('click', calcularSecao);
elements.btnMemorial.addEventListener('click', gerarMemorialTxt);
elements.btnAdicionarQuadro.addEventListener('click', adicionarAoQuadro);
elements.btnNovoProjeto.addEventListener('click', novoProjeto);
elements.btnSalvarProjeto.addEventListener('click', salvarProjeto);
elements.inputAbrirProjeto.addEventListener('change', abrirProjeto);
elements.btnExportarQuadro.addEventListener('click', exportarQuadroCSV);
elements.btnCalcularDemanda.addEventListener('click', calcularDemandaQuadro);

// Listeners Modal
elements.btnInfoMetodo.addEventListener('click', () => {
    elements.modalMetodos.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Trava scroll
});

function fecharModal() {
    elements.modalMetodos.style.display = 'none';
    document.body.style.overflow = 'auto'; // Destrava scroll
}

elements.btnCloseModal.addEventListener('click', fecharModal);

// Fechar se clicar fora da caixa branca
window.addEventListener('click', (event) => {
    if (event.target == elements.modalMetodos) {
        fecharModal();
    }
});

// Mostrar/Esconder campos de curto-circuito
elements.considerarCurto.addEventListener('change', () => {
    let show = elements.considerarCurto.value === "sim";
    elements.groupDuracaoCc.style.display = show ? 'block' : 'none';
    elements.groupIcc.style.display = show ? 'block' : 'none';
});

// Init check
atualizarTabelaQuadro();
updateDynamicValues();
elements.considerarCurto.dispatchEvent(new Event('change'));
