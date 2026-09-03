// Critério de pontuação da vistoria — mesma lógica usada no protótipo.
// Cada pergunta soma pontos (resposta principal + agravantes), normalizado
// para 0-100 (% de risco) por item. A nota final da vistoria é a média
// dos 4 itens (peso igual).

export const ITEM_META = {
  infestacao: { label: "Infestação de Plantas Daninhas" },
  pragas: { label: "Pragas / Doenças" },
  vigor: { label: "Vigor da Soqueira" },
  falha: { label: "Falha" },
};
export const ITEM_ORDER = ["infestacao", "pragas", "vigor", "falha"];
export const NOTA_LABEL = { 1: "Leve", 2: "Moderado", 3: "Crítico" };

export function scoreInfestacao(d) {
  let pts = 0;
  pts += d.cobertura === "<20%" ? 1 : d.cobertura === "20-50%" ? 2 : 3;
  pts += d.estagio === "Florida ou com semente" ? 1 : 0;
  pts += d.competeTouceira ? 1 : 0;
  pts += d.tipoPredominante === "Tiririca" ? 1 : (d.tipoPredominante === "Gramínea" || d.tipoPredominante === "Outra") ? 0.5 : 0;
  pts += d.controleRecente ? 0 : 1;
  return Math.round((pts / 7) * 100);
}

export function scorePragas(d) {
  let pts = 0;
  pts += d.incidencia === "<10%" ? 1 : d.incidencia === "10-30%" ? 2 : 3;
  pts += d.estagioDano === "Avançado" ? 1 : 0;
  pts += d.controleFeito ? 0 : 1;
  return Math.round((pts / 5) * 100);
}

export function scoreVigor(d) {
  const dev = d.desenvolvimento === "Compatível com idade" ? 1 : d.desenvolvimento === "Levemente atrasado" ? 2 : 3;
  const cor = d.coloracao === "Verde saudável" ? 1 : d.coloracao === "Amarelada" ? 2 : 3;
  const perf = d.perfilhamento === "Normal" ? 1 : d.perfilhamento === "Reduzido" ? 2 : 3;
  const uni = d.uniformidade === "Uniforme" ? 1 : d.uniformidade === "Manchas pequenas" ? 2 : 3;
  const raw = dev + cor + perf + uni;
  return Math.round(((raw - 4) / 8) * 100);
}

export function scoreFalha(d) {
  let pts = 0;
  pts += d.percentualFalha === "<10%" ? 1 : d.percentualFalha === "10-25%" ? 2 : 3;
  pts += d.distribuicao === "Trechos contínuos" ? 1 : 0;
  pts += d.reformaFeita ? 0 : 1;
  return Math.round((pts / 5) * 100);
}

export const SCORE = { infestacao: scoreInfestacao, pragas: scorePragas, vigor: scoreVigor, falha: scoreFalha };

export function scoreToNota(score) {
  if (score <= 33) return 1;
  if (score <= 66) return 2;
  return 3;
}

export const emptyItemData = {
  infestacao: { cobertura: "<20%", estagio: "Brotando/pequena", competeTouceira: false, tipoPredominante: "Folha larga", controleRecente: false, controleQuando: "" },
  pragas: { pragaIdentificada: "Cigarrinha", pragaOutra: "", incidencia: "<10%", estagioDano: "Inicial", controleFeito: false, controleDetalhe: "" },
  vigor: { desenvolvimento: "Compatível com idade", coloracao: "Verde saudável", perfilhamento: "Normal", uniformidade: "Uniforme", idadeCorte: "" },
  falha: { percentualFalha: "<10%", distribuicao: "Pontual", causaAparente: "Erosão", reformaFeita: false, reformaData: "" },
};

export function computeVisitScores(itens, overrides = {}) {
  const notas = {};
  const scores = {};
  ITEM_ORDER.forEach((k) => {
    const raw = SCORE[k](itens[k]);
    const override = overrides[k];
    scores[k] = override != null ? Math.round(((override - 1) / 2) * 100) : raw;
    notas[k] = override ?? scoreToNota(raw);
  });
  const notaFinal = Math.round(ITEM_ORDER.reduce((sum, k) => sum + scores[k], 0) / ITEM_ORDER.length);
  return { notas, scores, notaFinal };
}
