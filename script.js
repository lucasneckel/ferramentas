// script.js - Versão Simplificada
const fctTable = {
    "PVC": {
        "10": 1.22, "15": 1.17, "20": 1.12, "25": 1.06, "30": 1.00,
        "35": 0.94, "40": 0.87, "45": 0.79, "50": 0.71, "55": 0.61,
        "60": 0.50, "65": 0.00, "70": 0.00, "75": 0.00, "80": 0.00
    },
    "EPR": {
        "10": 1.15, "15": 1.12, "20": 1.08, "25": 1.04, "30": 1.00,
        "35": 0.96, "40": 0.91, "45": 0.87, "50": 0.82, "55": 0.76,
        "60": 0.71, "65": 0.65, "70": 0.58, "75": 0.50, "80": 0.41
    }
};

const fcaTable = {
    "1": { "1": 1.0, "2": 0.80, "3": 0.70, "4": 0.65, "5": 0.60, "6": 0.57, "7": 0.54, "8": 0.52, "9-11": 0.50, "12-15": 0.45, "16-19": 0.41, "20-": 0.38 },
    "2": { "1": 1.0, "2": 0.85, "3": 0.79, "4": 0.75, "5": 0.73, "6": 0.72, "7": 0.71, "8": 0.70, "9-11": 0.70, "12-15": 0.70, "16-19": 0.70, "20-": 0.70 },
    "3": { "1": 1.0, "2": 0.88, "3": 0.82, "4": 0.77, "5": 0.75, "6": 0.73, "7": 0.73, "8": 0.72, "9-11": 0.72, "12-15": 0.72, "16-19": 0.72, "20-": 0.72 },
    "4": { "1": 1.0, "2": 0.88, "3": 0.82, "4": 0.77, "5": 0.75, "6": 0.73, "7": 0.73, "8": 0.72, "9-11": 0.72, "12-15": 0.72, "16-19": 0.72, "20-": 0.72 },
    "5": { "1": 1.0, "2": 0.87, "3": 0.82, "4": 0.80, "5": 0.80, "6": 0.79, "7": 0.79, "8": 0.78, "9-11": 0.78, "12-15": 0.78, "16-19": 0.78, "20-": 0.78 }
};

const izCobrePVC_B1 = {
    1.5: [17.5, 15.5], 2.5: [24, 21], 4: [32, 28], 6: [41, 36], 10: [57, 50],
    16: [76, 68], 25: [101, 89], 35: [125, 111], 50: [151, 134], 70: [192, 171]
};

const izCobreEPR_B1 = {
    1.5: [22, 19.5], 2.5: [30, 26], 4: [40, 35], 6: [51, 44], 10: [71, 62],
    16: [96, 84], 25: [127, 112], 35: [157, 138], 50: [190, 167], 70: [242, 214]
};

const izAluminioPVC_B1 = {
    16: [59, 53], 25: [77, 69], 35: [96, 86], 50: [117, 104], 70: [149, 133], 95: [180, 161], 120: [208, 186], 150: [236, 211]
};

const izAluminioEPR_B1 = {
    16: [73, 64], 25: [98, 87], 35: [122, 108], 50: [149, 132], 70: [192, 170], 95: [235, 207], 120: [273, 240], 150: [316, 277]
};

const fatorK = {
    "cobre": { "PVC": 115, "EPR": 143 },
    "aluminio": { "PVC": 76, "EPR": 94 }
};

const resistividade = {
    "cobre": 0.0225,
    "aluminio": 0.0360
};

const secoesComerciais = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150];
const disjuntoresComerciais = [2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];

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
    
    // Modal
    btnInfoMetodo: document.getElementById('btn-info-metodo'),
    modalMetodos: document.getElementById('modal-metodos'),
    btnCloseModal: document.getElementById('btn-close-modal')
};

function updateDynamicValues() {
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

    let fases = elements.fases.value; 
    let sistTensao = elements.tensao.value;

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

    let iso = elements.isolacao.value;
    let temp = elements.temperatura.value;
    let fct = fctTable[iso][temp] || 1.0;
    elements.fcTemperatura.value = fct.toFixed(2);

    let agrup = elements.formaAgrupamento.value; 
    let circs = elements.circuitosAgrupados.value; 
    let fca = fcaTable[agrup][circs] || 1.0;
    elements.fcAgrupamento.value = fca.toFixed(2);

    let id_ajustada = fct * fca > 0 ? (ib / (fct * fca)) : 0;
    elements.correnteAjustada.value = id_ajustada.toFixed(2);
}

function calcularSecao() {
    updateDynamicValues();

    let ibLines = parseFloat(elements.correnteProjeto.value);
    let ibAjust = parseFloat(elements.correnteAjustada.value);
    let mat = elements.material.value;

    let secMin = 0;
    if (mat === "aluminio") {
        secMin = 16;
    } else {
        secMin = elements.tipoCircuito.value === "iluminacao" ? 1.5 : 2.5;
    }
    elements.resMin.textContent = secMin + " mm²";

    let secCond = 0;
    let maxIz = 0;
    let iso = elements.isolacao.value;
    let condCarr = elements.condutoresCarregados.value === "2" ? 0 : 1;

    let tabelaAlvo = null;
    if (mat === "cobre") {
        tabelaAlvo = iso === "PVC" ? izCobrePVC_B1 : izCobreEPR_B1;
    } else {
        tabelaAlvo = iso === "PVC" ? izAluminioPVC_B1 : izAluminioEPR_B1;
    }

    for (let s of secoesComerciais) {
        if (mat === "aluminio" && s < 16) continue;
        if (tabelaAlvo[s]) {
            let iz = tabelaAlvo[s][condCarr];
            if (iz >= ibAjust) {
                secCond = s;
                maxIz = iz;
                break;
            }
        }
    }
    if (secCond === 0) secCond = 150;
    elements.resConducao.textContent = secCond + " mm²";

    let comp = parseFloat(elements.comprimento.value) || 10;
    let maxQPerc = parseFloat(elements.maxQueda.value) || 4;

    let sistTensao = elements.tensao.value;
    let vFase = sistTensao === "127" ? 127 : 220;
    let vLinha = sistTensao === "127" ? 220 : 380;
    let eMax = (maxQPerc / 100) * (elements.fases.value === "1" ? vFase : vLinha);
    let rho = resistividade[mat];

    let secQueda = 0;
    if (elements.fases.value === "3") {
        secQueda = (Math.sqrt(3) * rho * comp * ibLines) / eMax;
    } else {
        secQueda = (2 * rho * comp * ibLines) / eMax;
    }

    let secQuedaComercial = secoesComerciais.find(s => s >= secQueda && !(mat === "aluminio" && s < 16)) || 150;
    elements.resQueda.textContent = secQuedaComercial + " mm²";

    let adoptCurto = elements.considerarCurto.value === "sim";
    let iccVal = parseFloat(elements.icc.value) * 1000;
    let tMs = parseFloat(elements.duracaoCc.value) / 1000;
    let kVal = fatorK[mat][iso];

    let secCurtoCalc = (iccVal * Math.sqrt(tMs)) / kVal;
    let secCurtoComercial = adoptCurto ? (secoesComerciais.find(s => s >= secCurtoCalc && !(mat === "aluminio" && s < 16)) || 150) : 0;
    elements.resCurto.textContent = adoptCurto ? (secCurtoComercial + " mm²") : "Desconsiderado";

    let adotada = Math.max(secMin, secCond, secQuedaComercial, secCurtoComercial);

    let quedaRealV = 0;
    if (elements.fases.value === "3") {
        quedaRealV = (Math.sqrt(3) * rho * comp * ibLines) / adotada;
    } else {
        quedaRealV = (2 * rho * comp * ibLines) / adotada;
    }
    let quedaRealPerc = (quedaRealV / (elements.fases.value === "1" ? vFase : vLinha)) * 100;

    let nomeMaterial = mat === "aluminio" ? "Alumínio" : "Cobre";
    elements.resAdotada.innerHTML = adotada + " mm² <span>(Material: " + nomeMaterial + ")</span>";
    elements.resDetalhes.textContent = `Iz Cabo: ${maxIz} A | Queda Tensão: ${quedaRealPerc.toFixed(2)} % | Ib': ${ibAjust.toFixed(2)} A`;
    
    elements.resultados.classList.remove('hidden');

    let ib = parseFloat(elements.correnteProjeto.value);
    let disjuntorIn = 0;
    for (let in_comercial of disjuntoresComerciais) {
        if (in_comercial >= ib && in_comercial <= maxIz) {
            disjuntorIn = in_comercial;
            break;
        }
    }
    
    let msgDisjuntor = disjuntorIn > 0 ? `${disjuntorIn} A` : "Sobredimensionar!";
    let fVal = elements.fases.value;
    let polos = "Monopolar";
    if (fVal === "2") polos = "Bipolar";
    if (fVal === "3") polos = "Tripolar";
    
    let curvaRecomendada = elements.tipoCircuito.value === "iluminacao" ? "B" : "C"; 

    let iccReq = parseFloat(elements.icc.value);
    let iccDisj = 3.0; 
    if (iccReq > 3.0 && iccReq <= 4.5) iccDisj = 4.5;
    else if (iccReq > 4.5 && iccReq <= 6.0) iccDisj = 6.0;
    else if (iccReq > 6.0 && iccReq <= 10.0) iccDisj = 10.0;
    else if (iccReq > 10.0) iccDisj = Math.ceil(iccReq);

    elements.resDisjuntor.innerHTML = `${msgDisjuntor} <span>(Curva ${curvaRecomendada}, ${polos})</span>`;
    elements.resDisjuntorDetalhes.textContent = `Capacidade de Curto-Circuito Recomendada: ≥ ${iccDisj} kA`;
}

const inputsParaObservar = [
    elements.potencia, elements.unidadePotencia, elements.fatorPotencia,
    elements.fases, elements.tensao, elements.isolacao, elements.temperatura,
    elements.circuitosAgrupados, elements.formaAgrupamento, elements.material,
    elements.tipoCircuito
];

inputsParaObservar.forEach(el => {
    el.addEventListener('input', updateDynamicValues);
    el.addEventListener('change', updateDynamicValues);
});

elements.btnCalcular.addEventListener('click', calcularSecao);

elements.btnInfoMetodo.addEventListener('click', () => {
    elements.modalMetodos.style.display = 'flex';
    document.body.style.overflow = 'hidden';
});

function fecharModal() {
    elements.modalMetodos.style.display = 'none';
    document.body.style.overflow = 'auto';
}

elements.btnCloseModal.addEventListener('click', fecharModal);
window.addEventListener('click', (event) => {
    if (event.target == elements.modalMetodos) fecharModal();
});

elements.considerarCurto.addEventListener('change', () => {
    let show = elements.considerarCurto.value === "sim";
    elements.groupDuracaoCc.style.display = show ? 'block' : 'none';
    elements.groupIcc.style.display = show ? 'block' : 'none';
});

updateDynamicValues();
elements.considerarCurto.dispatchEvent(new Event('change'));
