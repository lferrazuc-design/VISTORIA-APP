"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Wifi, WifiOff, CheckCircle2, Clock, AlertTriangle, ClipboardList,
  BarChart3, ChevronDown, ChevronRight, RefreshCw, Sprout, Bug, Leaf, TreeDeciduous, FileDown,
} from "lucide-react";
import FAZENDAS from "@/lib/farms.json";
import {
  ITEM_META, ITEM_ORDER, NOTA_LABEL, SCORE, scoreToNota, emptyItemData, computeVisitScores,
} from "@/lib/scoring";

const ICONS = { infestacao: Leaf, pragas: Bug, vigor: Sprout, falha: TreeDeciduous };

// ---------- Design tokens ----------
const C = {
  bg: "#F6F4EC", card: "#FFFFFF", border: "#E1DCC9", ink: "#20301F", inkSoft: "#5B6B57",
  brand: "#1F3D2B", brandSoft: "#2F4F35", amber: "#B9762C", amberSoft: "#F4E4CC",
  n1bg: "#E4F0DF", n1fg: "#2F6B3A", n2bg: "#FBEBD1", n2fg: "#8A5A00", n3bg: "#FBDFDD", n3fg: "#9B2C2C",
};
const notaBg = (n) => (n === 1 ? C.n1bg : n === 2 ? C.n2bg : C.n3bg);
const notaFg = (n) => (n === 1 ? C.n1fg : n === 2 ? C.n2fg : C.n3fg);

function emptyForm() {
  return {
    codigoFazenda: "", nomeFazenda: "", talhao: "", tecnico: "", fornecedor: "",
    itens: JSON.parse(JSON.stringify(emptyItemData)), overrides: {}, obsGerais: "",
  };
}

// ---------- Small UI atoms ----------
function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-sm mb-1" style={{ color: C.inkSoft }}>{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full rounded-md px-3 py-2 text-sm outline-none";
const inputStyle = { border: `1px solid ${C.border}`, background: "#FFFDF9", color: C.ink };
function Select({ value, onChange, options }) {
  return (
    <select className={inputCls} style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function TextInput(props) { return <input className={inputCls} style={inputStyle} {...props} />; }
function Toggle({ value, onChange, labelOn = "Sim", labelOff = "Não" }) {
  return (
    <div className="flex gap-2">
      {[{ v: false, t: labelOff }, { v: true, t: labelOn }].map((opt) => (
        <button key={opt.t} type="button" onClick={() => onChange(opt.v)}
          className="flex-1 rounded-md py-2 text-sm font-medium"
          style={{
            border: `1px solid ${value === opt.v ? C.brand : C.border}`,
            background: value === opt.v ? C.brand : "#FFFDF9",
            color: value === opt.v ? "#fff" : C.inkSoft,
          }}>
          {opt.t}
        </button>
      ))}
    </div>
  );
}
function NotaBadge({ n }) {
  return (
    <span className="inline-flex items-center rounded-full font-semibold px-2 py-0.5 text-xs" style={{ background: notaBg(n), color: notaFg(n) }}>
      {n} · {NOTA_LABEL[n]}
    </span>
  );
}

// ---------- Item accordion card ----------
function ItemCard({ itemKey, data, onData, overrideNota, onOverride, open, onToggle }) {
  const meta = ITEM_META[itemKey];
  const Icon = ICONS[itemKey];
  const rawScore = SCORE[itemKey](data);
  const suggested = scoreToNota(rawScore);
  const finalNota = overrideNota ?? suggested;
  const finalScore = overrideNota != null ? Math.round(((overrideNota - 1) / 2) * 100) : rawScore;
  const setD = (patch) => onData({ ...data, ...patch });

  return (
    <div className="rounded-lg mb-3 overflow-hidden" style={{ border: `1px solid ${C.border}`, background: C.card }}>
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3">
        <span className="flex items-center gap-2 font-medium" style={{ color: C.ink }}>
          <Icon size={18} style={{ color: C.brandSoft }} /> {meta.label}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: C.inkSoft }}>{finalScore}%</span>
          <NotaBadge n={finalNota} />
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${C.border}` }}>
          {itemKey === "infestacao" && (
            <>
              <Field label="Cobertura da área pela daninha">
                <Select value={data.cobertura} onChange={(v) => setD({ cobertura: v })} options={["<20%", "20-50%", ">50%"]} />
              </Field>
              <Field label="Estágio da daninha">
                <Select value={data.estagio} onChange={(v) => setD({ estagio: v })} options={["Brotando/pequena", "Florida ou com semente"]} />
              </Field>
              <Field label="Está competindo diretamente com a touceira?">
                <Toggle value={data.competeTouceira} onChange={(v) => setD({ competeTouceira: v })} />
              </Field>
              <Field label="Tipo predominante">
                <Select value={data.tipoPredominante} onChange={(v) => setD({ tipoPredominante: v })} options={["Folha larga", "Gramínea", "Tiririca", "Outra"]} />
              </Field>
              <Field label="Houve controle recente (herbicida/capina)?">
                <Toggle value={data.controleRecente} onChange={(v) => setD({ controleRecente: v })} />
              </Field>
              {data.controleRecente && (
                <Field label="Quando"><TextInput value={data.controleQuando} onChange={(e) => setD({ controleQuando: e.target.value })} placeholder="ex: há 2 semanas" /></Field>
              )}
            </>
          )}
          {itemKey === "pragas" && (
            <>
              <Field label="Praga/doença identificada">
                <Select value={data.pragaIdentificada} onChange={(v) => setD({ pragaIdentificada: v })} options={["Cigarrinha", "Broca", "Cupim", "Ferrugem", "Outra"]} />
              </Field>
              {data.pragaIdentificada === "Outra" && (
                <Field label="Qual"><TextInput value={data.pragaOutra} onChange={(e) => setD({ pragaOutra: e.target.value })} /></Field>
              )}
              <Field label="Nível de incidência (% de touceiras afetadas)">
                <Select value={data.incidencia} onChange={(v) => setD({ incidencia: v })} options={["<10%", "10-30%", ">30%"]} />
              </Field>
              <Field label="Estágio do dano">
                <Select value={data.estagioDano} onChange={(v) => setD({ estagioDano: v })} options={["Inicial", "Avançado"]} />
              </Field>
              <Field label="Já houve controle nessa área?">
                <Toggle value={data.controleFeito} onChange={(v) => setD({ controleFeito: v })} />
              </Field>
              {data.controleFeito && (
                <Field label="Quando / funcionou?"><TextInput value={data.controleDetalhe} onChange={(e) => setD({ controleDetalhe: e.target.value })} /></Field>
              )}
            </>
          )}
          {itemKey === "vigor" && (
            <>
              <Field label="Desenvolvimento vs. idade esperada">
                <Select value={data.desenvolvimento} onChange={(v) => setD({ desenvolvimento: v })} options={["Compatível com idade", "Levemente atrasado", "Muito atrasado"]} />
              </Field>
              <Field label="Coloração das folhas">
                <Select value={data.coloracao} onChange={(v) => setD({ coloracao: v })} options={["Verde saudável", "Amarelada", "Seca"]} />
              </Field>
              <Field label="Perfilhamento por touceira">
                <Select value={data.perfilhamento} onChange={(v) => setD({ perfilhamento: v })} options={["Normal", "Reduzido", "Muito baixo"]} />
              </Field>
              <Field label="Uniformidade da soqueira na área">
                <Select value={data.uniformidade} onChange={(v) => setD({ uniformidade: v })} options={["Uniforme", "Manchas pequenas", "Manchas/reboleiras grandes"]} />
              </Field>
              <Field label="Idade do último corte (meses)">
                <TextInput value={data.idadeCorte} onChange={(e) => setD({ idadeCorte: e.target.value })} inputMode="numeric" placeholder="ex: 8" />
              </Field>
            </>
          )}
          {itemKey === "falha" && (
            <>
              <Field label="% de falha na linha de plantio">
                <Select value={data.percentualFalha} onChange={(v) => setD({ percentualFalha: v })} options={["<10%", "10-25%", ">25%"]} />
              </Field>
              <Field label="Distribuição da falha">
                <Select value={data.distribuicao} onChange={(v) => setD({ distribuicao: v })} options={["Pontual", "Trechos contínuos"]} />
              </Field>
              <Field label="Causa aparente">
                <Select value={data.causaAparente} onChange={(v) => setD({ causaAparente: v })} options={["Erosão", "Encharcamento", "Praga/formiga", "Pisoteio", "Mecanização", "Morte natural", "Outra"]} />
              </Field>
              <Field label="Já foi feito replantio/reforma?">
                <Toggle value={data.reformaFeita} onChange={(v) => setD({ reformaFeita: v })} />
              </Field>
              {data.reformaFeita && (
                <Field label="Data (se souber)"><TextInput value={data.reformaData} onChange={(e) => setD({ reformaData: e.target.value })} placeholder="mm/aaaa" /></Field>
              )}
            </>
          )}

          <div className="mt-2 pt-3" style={{ borderTop: `1px dashed ${C.border}` }}>
            <span className="block text-sm mb-2" style={{ color: C.inkSoft }}>
              Pontuação calculada: {rawScore}% de risco (sugestão: nota {suggested})
            </span>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button key={n} type="button" onClick={() => onOverride(n)}
                  className="flex-1 rounded-md py-2 text-sm font-semibold"
                  style={{
                    background: finalNota === n ? notaBg(n) : "#FFFDF9",
                    color: finalNota === n ? notaFg(n) : C.inkSoft,
                    border: `1px solid ${finalNota === n ? notaFg(n) : C.border}`,
                  }}>
                  {n}
                </button>
              ))}
              {overrideNota != null && (
                <button type="button" onClick={() => onOverride(null)} className="text-xs underline px-2" style={{ color: C.inkSoft }}>
                  usar sugestão
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Main App ----------
export default function Home() {
  const [view, setView] = useState("form");
  const [form, setForm] = useState(emptyForm());
  const [openItem, setOpenItem] = useState("infestacao");
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending] = useState([]);
  const [synced, setSynced] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [lastSavedScore, setLastSavedScore] = useState(null);
  const [formError, setFormError] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const loadAll = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/visitas");
      const data = await res.json();
      setSynced(data.visitas || []);
    } catch (e) {
      // offline ou API fora do ar — mantém o que já tinha
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { if (view === "list" || view === "dashboard") loadAll(); }, [view, loadAll]);

  const postVisit = useCallback(async (payload) => {
    const res = await fetch("/api/visitas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("save failed");
    const data = await res.json();
    return data.visita;
  }, []);

  const syncPending = useCallback(async () => {
    if (!pending.length) return;
    setSyncing(true);
    const remaining = [];
    const newlySynced = [];
    for (const p of pending) {
      try {
        const saved = await postVisit(p.payload);
        newlySynced.push(saved);
      } catch (e) {
        remaining.push(p);
      }
    }
    setPending(remaining);
    if (newlySynced.length) setSynced((s) => [...newlySynced, ...s]);
    setSyncing(false);
  }, [pending, postVisit]);

  useEffect(() => { if (isOnline && pending.length) syncPending(); }, [isOnline]); // eslint-disable-line

  const updateItem = (key, data) => setForm((f) => ({ ...f, itens: { ...f.itens, [key]: data } }));
  const setOverride = (key, n) => setForm((f) => ({ ...f, overrides: { ...f.overrides, [key]: n } }));

  async function handleSubmit() {
    if (!form.codigoFazenda.trim() || !form.nomeFazenda.trim() || !form.tecnico.trim() || !form.fornecedor.trim()) {
      setFormError("Preencha código da fazenda, nome da fazenda, técnico e fornecedor antes de salvar.");
      return;
    }
    setFormError("");
    const payload = {
      codigoFazenda: form.codigoFazenda.trim(),
      nomeFazenda: form.nomeFazenda.trim(),
      talhao: form.talhao.trim(),
      tecnico: form.tecnico.trim(),
      fornecedor: form.fornecedor.trim(),
      itens: form.itens,
      overrides: form.overrides,
      obsGerais: form.obsGerais.trim(),
    };

    let notaFinal = null;
    try {
      const saved = await postVisit(payload);
      setSynced((s) => [saved, ...s]);
      notaFinal = saved.notaFinal;
    } catch (e) {
      setPending((p) => [...p, { id: `local-${Date.now()}`, payload }]);
    }

    setForm(emptyForm());
    setOpenItem("infestacao");
    setLastSavedScore(notaFinal);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 4500);
  }

  return (
    <div className="min-h-full w-full" style={{ background: C.bg, color: C.ink, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <Header isOnline={isOnline} pendingCount={pending.length} onSync={syncPending} syncing={syncing} />
      <NavTabs view={view} setView={setView} pendingCount={pending.length} />
      <div className="max-w-md mx-auto px-4 pb-24 pt-4">
        {view === "form" && (
          <FormView form={form} setForm={setForm} openItem={openItem} setOpenItem={setOpenItem}
            updateItem={updateItem} setOverride={setOverride} onSubmit={handleSubmit}
            error={formError} justSaved={justSaved} lastSavedScore={lastSavedScore} />
        )}
        {view === "list" && (
          <ListView pending={pending} synced={synced} loading={loadingList} onRefresh={loadAll} />
        )}
        {view === "dashboard" && (
          <DashboardView allVisits={[...pending.map((p) => normalizePendingForDisplay(p)), ...synced]} loading={loadingList} onRefresh={loadAll} />
        )}
        {view === "reports" && (
          <ReportsView allVisits={[...pending.map((p) => normalizePendingForDisplay(p)), ...synced]} />
        )}
      </div>
    </div>
  );
}

function normalizePendingForDisplay(p) {
  // Vistoria ainda não sincronizada: calcula localmente pra poder exibir/filtrar
  // enquanto não confirma no banco (usa a mesma lógica de scoring do servidor).
  const { notas, scores, notaFinal } = computeVisitScores(p.payload.itens, p.payload.overrides || {});
  return {
    id: p.id, timestamp: Date.now(), dataVisita: new Date().toLocaleDateString("pt-BR"),
    codigoFazenda: p.payload.codigoFazenda, nomeFazenda: p.payload.nomeFazenda, talhao: p.payload.talhao,
    tecnico: p.payload.tecnico, fornecedor: p.payload.fornecedor, itens: p.payload.itens,
    notas, scores, notaFinal, obsGerais: p.payload.obsGerais, _pending: true,
  };
}

function Header({ isOnline, pendingCount, onSync, syncing }) {
  return (
    <div style={{ background: C.brand }} className="text-white">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold leading-tight">Vistoria de Área</div>
          <div className="text-xs opacity-80">Cerradão · situação da soqueira</div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{isOnline ? "Online" : "Sem conexão"}</span>
        </div>
      </div>
      {pendingCount > 0 && (
        <div className="max-w-md mx-auto px-4 pb-3">
          <button onClick={onSync} disabled={!isOnline || syncing}
            className="w-full flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium"
            style={{ background: C.amber, color: "#fff", opacity: !isOnline || syncing ? 0.6 : 1 }}>
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {isOnline ? (syncing ? "Sincronizando..." : `${pendingCount} vistoria(s) pendente(s) — sincronizar agora`) : `${pendingCount} vistoria(s) aguardando conexão`}
          </button>
        </div>
      )}
    </div>
  );
}

function NavTabs({ view, setView, pendingCount }) {
  const tabs = [
    { k: "form", label: "Nova", icon: ClipboardList },
    { k: "list", label: "Vistorias", icon: Clock },
    { k: "dashboard", label: "Dashboard", icon: BarChart3 },
    { k: "reports", label: "Relatórios", icon: FileDown },
  ];
  return (
    <div className="max-w-md mx-auto px-4 pt-3 flex gap-2">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = view === t.k;
        return (
          <button key={t.k} onClick={() => setView(t.k)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium relative"
            style={{ background: active ? C.card : "transparent", border: `1px solid ${active ? C.border : "transparent"}`, color: active ? C.brand : C.inkSoft }}>
            <Icon size={15} /> {t.label}
            {t.k === "list" && pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 rounded-full text-[10px] w-4 h-4 flex items-center justify-center" style={{ background: C.amber, color: "#fff" }}>
                {pendingCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function FormView({ form, setForm, openItem, setOpenItem, updateItem, setOverride, onSubmit, error, justSaved, lastSavedScore }) {
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const [nomeAuto, setNomeAuto] = useState(false);

  const handleCodigoChange = (val) => {
    const patch = { codigoFazenda: val };
    const nomeConhecido = FAZENDAS[val.trim()];
    if (nomeConhecido) {
      patch.nomeFazenda = nomeConhecido;
      setNomeAuto(true);
    } else if (nomeAuto) {
      patch.nomeFazenda = "";
      setNomeAuto(false);
    }
    set(patch);
  };

  return (
    <div>
      {justSaved && (
        <div className="mb-4 rounded-md px-3 py-2 flex items-center gap-2 text-sm" style={{ background: C.n1bg, color: C.n1fg }}>
          <CheckCircle2 size={16} />
          Vistoria salva com sucesso.{lastSavedScore != null ? ` Nota final: ${lastSavedScore}% de risco.` : ""}
        </div>
      )}
      <div className="rounded-lg p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código da fazenda">
            <TextInput list="fazendas-datalist" value={form.codigoFazenda} onChange={(e) => handleCodigoChange(e.target.value)} placeholder="ex: 11002" />
            <datalist id="fazendas-datalist">
              {Object.entries(FAZENDAS).map(([cod, nome]) => <option key={cod} value={cod}>{nome}</option>)}
            </datalist>
          </Field>
          <Field label="Talhão (opcional)">
            <TextInput value={form.talhao} onChange={(e) => set({ talhao: e.target.value })} />
          </Field>
        </div>
        <Field label="Nome da fazenda">
          <TextInput value={form.nomeFazenda} onChange={(e) => { setNomeAuto(false); set({ nomeFazenda: e.target.value }); }}
            placeholder={nomeAuto ? "" : "Não encontrado no cadastro — digite manualmente"} />
          {nomeAuto && (
            <span className="text-xs mt-1 flex items-center gap-1" style={{ color: C.n1fg }}>
              <CheckCircle2 size={12} /> preenchido automaticamente pelo código
            </span>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Técnico responsável">
            <TextInput value={form.tecnico} onChange={(e) => set({ tecnico: e.target.value })} />
          </Field>
          <Field label="Fornecedor">
            <TextInput value={form.fornecedor} onChange={(e) => set({ fornecedor: e.target.value })} />
          </Field>
        </div>
      </div>

      {ITEM_ORDER.map((key) => (
        <ItemCard key={key} itemKey={key} data={form.itens[key]} onData={(d) => updateItem(key, d)}
          overrideNota={form.overrides[key] ?? null} onOverride={(n) => setOverride(key, n)}
          open={openItem === key} onToggle={() => setOpenItem(openItem === key ? null : key)} />
      ))}

      <div className="rounded-lg p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <Field label="Observações gerais">
          <textarea className={inputCls} style={{ ...inputStyle, minHeight: 80 }} value={form.obsGerais} onChange={(e) => set({ obsGerais: e.target.value })} />
        </Field>
      </div>

      {error && (
        <div className="mb-3 rounded-md px-3 py-2 flex items-center gap-2 text-sm" style={{ background: C.n3bg, color: C.n3fg }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <button onClick={onSubmit} className="w-full rounded-md py-3 font-semibold text-white" style={{ background: C.brand }}>
        Salvar vistoria
      </button>
      <p className="text-xs mt-2 text-center" style={{ color: C.inkSoft }}>
        Se estiver sem sinal, a vistoria fica guardada no aparelho e sincroniza sozinha quando a conexão voltar.
      </p>
    </div>
  );
}

function ListView({ pending, synced, loading, onRefresh }) {
  const all = [...pending.map((p) => normalizePendingForDisplay(p)), ...synced];
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm" style={{ color: C.inkSoft }}>{all.length} vistoria(s)</span>
        <button onClick={onRefresh} className="flex items-center gap-1 text-sm" style={{ color: C.brand }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>
      {all.length === 0 && <div className="text-sm text-center py-10" style={{ color: C.inkSoft }}>Nenhuma vistoria registrada ainda.</div>}
      {all.map((v) => (
        <div key={v.id} className="rounded-lg p-3 mb-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium">{v.nomeFazenda} <span style={{ color: C.inkSoft }}>· {v.codigoFazenda}</span></div>
              <div className="text-xs" style={{ color: C.inkSoft }}>{v.tecnico} · {v.fornecedor} · {v.dataVisita}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-medium rounded-full px-2 py-0.5 flex items-center gap-1"
                style={v._pending ? { background: C.amberSoft, color: C.amber } : { background: C.n1bg, color: C.n1fg }}>
                {v._pending ? <><Clock size={10} /> pendente</> : <><CheckCircle2 size={10} /> sincronizada</>}
              </span>
              <span className="text-xs font-semibold" style={{ color: notaFg(scoreToNota(v.notaFinal)) }}>{v.notaFinal}% de risco</span>
            </div>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {ITEM_ORDER.map((k) => (
              <span key={k} className="text-[11px] rounded px-1.5 py-0.5" style={{ background: notaBg(v.notas[k]), color: notaFg(v.notas[k]) }}>
                {ITEM_META[k].label.split(" ")[0]} {v.notas[k]}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardView({ allVisits, loading, onRefresh }) {
  const [groupBy, setGroupBy] = useState("fazenda");
  const [selected, setSelected] = useState(null);

  const groups = useMemo(() => {
    const map = {};
    allVisits.forEach((v) => {
      const key = groupBy === "fazenda" ? `${v.nomeFazenda} (${v.codigoFazenda})` : v.fornecedor;
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(v);
    });
    return map;
  }, [allVisits, groupBy]);

  const rows = useMemo(() => {
    return Object.entries(groups).map(([name, visits]) => {
      const criticidade = Math.round(visits.reduce((a, v) => a + v.notaFinal, 0) / visits.length);
      return { name, count: visits.length, criticidade, visits };
    }).sort((a, b) => b.criticidade - a.criticidade);
  }, [groups]);

  const chartData = useMemo(() => {
    const sel = rows.find((r) => r.name === selected) || rows[0];
    if (!sel) return [];
    return ITEM_ORDER.map((k) => {
      const visits = sel.visits;
      const pct = (n) => Math.round((visits.filter((v) => v.notas[k] === n).length / visits.length) * 100);
      return { item: ITEM_META[k].label.split(" ")[0], "Nota 1": pct(1), "Nota 2": pct(2), "Nota 3": pct(3) };
    });
  }, [rows, selected]);

  const selectedRow = rows.find((r) => r.name === selected) || rows[0];

  if (!allVisits.length) {
    return <div className="text-sm text-center py-10" style={{ color: C.inkSoft }}>Ainda não há vistorias para montar o dashboard.</div>;
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {["fazenda", "fornecedor"].map((g) => (
          <button key={g} onClick={() => { setGroupBy(g); setSelected(null); }}
            className="flex-1 rounded-md py-2 text-sm font-medium capitalize"
            style={{ background: groupBy === g ? C.brand : C.card, color: groupBy === g ? "#fff" : C.inkSoft, border: `1px solid ${groupBy === g ? C.brand : C.border}` }}>
            Por {g === "fazenda" ? "área" : "fornecedor"}
          </button>
        ))}
        <button onClick={onRefresh} className="rounded-md px-3" style={{ border: `1px solid ${C.border}`, color: C.brand }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="rounded-lg mb-3 overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        {rows.map((r) => (
          <button key={r.name} onClick={() => setSelected(r.name)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left"
            style={{ borderBottom: `1px solid ${C.border}`, background: (selectedRow?.name === r.name) ? C.bg : "transparent" }}>
            <div>
              <div className="text-sm font-medium">{r.name}</div>
              <div className="text-xs" style={{ color: C.inkSoft }}>{r.count} vistoria(s)</div>
            </div>
            <span className="text-sm font-semibold rounded-full px-2.5 py-1" style={{
              background: r.criticidade >= 66 ? C.n3bg : r.criticidade >= 33 ? C.n2bg : C.n1bg,
              color: r.criticidade >= 66 ? C.n3fg : r.criticidade >= 33 ? C.n2fg : C.n1fg,
            }}>
              {r.criticidade}% crítico
            </span>
          </button>
        ))}
      </div>

      {selectedRow && (
        <div className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-sm font-medium mb-2">{selectedRow.name} — % de vistorias por nota</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="item" tick={{ fontSize: 11, fill: C.inkSoft }} />
              <YAxis tick={{ fontSize: 11, fill: C.inkSoft }} unit="%" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Nota 1" stackId="a" fill={C.n1fg} />
              <Bar dataKey="Nota 2" stackId="a" fill={C.n2fg} />
              <Bar dataKey="Nota 3" stackId="a" fill={C.n3fg} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function buildReportHtml(title, visits) {
  const rows = visits.map((v, idx) => {
    const scores = v.scores || {};
    return `
    <div style="margin-bottom:24px; ${idx < visits.length - 1 ? "page-break-after: always;" : ""} border-bottom:1px solid #ccc; padding-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:baseline;">
        <h2 style="font-size:16px; margin-bottom:6px;">${v.nomeFazenda} (${v.codigoFazenda})${v.talhao ? ` — Talhão ${v.talhao}` : ""}</h2>
        <span style="font-size:14px; font-weight:bold; color:${v.notaFinal >= 66 ? "#9B2C2C" : v.notaFinal >= 33 ? "#8A5A00" : "#2F6B3A"};">Nota final: ${v.notaFinal}% de risco</span>
      </div>
      <table style="font-size:12px; margin-bottom:10px; width:100%;">
        <tr><td style="font-weight:bold; padding-right:8px;">Data:</td><td>${v.dataVisita}</td></tr>
        <tr><td style="font-weight:bold; padding-right:8px;">Técnico:</td><td>${v.tecnico}</td></tr>
        <tr><td style="font-weight:bold; padding-right:8px;">Fornecedor:</td><td>${v.fornecedor}</td></tr>
      </table>
      <table style="font-size:12px; width:100%; border-collapse:collapse;">
        <thead><tr>
          <th style="text-align:left; border-bottom:1px solid #999; padding:4px;">Item</th>
          <th style="text-align:left; border-bottom:1px solid #999; padding:4px;">Pontuação</th>
          <th style="text-align:left; border-bottom:1px solid #999; padding:4px;">Nota</th>
        </tr></thead>
        <tbody>
          ${ITEM_ORDER.map((k) => `
            <tr>
              <td style="padding:4px; border-bottom:1px solid #eee;">${ITEM_META[k].label}</td>
              <td style="padding:4px; border-bottom:1px solid #eee;">${scores[k] != null ? scores[k] + "%" : "—"}</td>
              <td style="padding:4px; border-bottom:1px solid #eee;">${v.notas[k]} — ${NOTA_LABEL[v.notas[k]]}</td>
            </tr>`).join("")}
        </tbody>
      </table>
      ${v.obsGerais ? `<p style="font-size:12px; margin-top:10px;"><strong>Observações gerais:</strong> ${v.obsGerais}</p>` : ""}
    </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Relatório de Vistoria — ${title}</title>
<style>
  body { font-family: Georgia, serif; color: #111; padding: 24px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  p.subtitle { font-size: 12px; color: #555; margin-bottom: 20px; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style>
</head><body>
  <h1>Relatório de Vistoria de Área</h1>
  <p class="subtitle">${title} — ${visits.length} vistoria(s) — gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
  <p class="no-print" style="font-size:11px; color:#888; margin-bottom:16px;">Dica: use Ctrl+P (ou Cmd+P) e escolha "Salvar como PDF", ou abra este relatório direto no navegador (fora do Claude não deve haver bloqueio de pop-up/impressão).</p>
  ${rows}
</body></html>`;
}

function downloadReport(title, visits) {
  const html = buildReportHtml(title, visits);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = title.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 60);
  a.href = url;
  a.download = `relatorio_vistorias_${safeName || "geral"}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function ReportsView({ allVisits }) {
  const [filterType, setFilterType] = useState("fazenda");
  const [filterValue, setFilterValue] = useState("");

  const options = useMemo(() => {
    const set = new Set();
    allVisits.forEach((v) => set.add(filterType === "fazenda" ? `${v.nomeFazenda} (${v.codigoFazenda})` : v.fornecedor));
    return Array.from(set).sort();
  }, [allVisits, filterType]);

  const matching = useMemo(() => {
    if (!filterValue) return [];
    return allVisits.filter((v) => (filterType === "fazenda" ? `${v.nomeFazenda} (${v.codigoFazenda})` === filterValue : v.fornecedor === filterValue));
  }, [allVisits, filterType, filterValue]);

  if (!allVisits.length) {
    return <div className="text-sm text-center py-10" style={{ color: C.inkSoft }}>Ainda não há vistorias para gerar relatório.</div>;
  }

  return (
    <div>
      <div className="rounded-lg p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <Field label="Filtrar por">
          <Select value={filterType} onChange={(v) => { setFilterType(v); setFilterValue(""); }} options={["fazenda", "fornecedor"]} />
        </Field>
        <Field label={filterType === "fazenda" ? "Fazenda" : "Fornecedor"}>
          <select className={inputCls} style={inputStyle} value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
            <option value="">Selecione...</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
      </div>
      {filterValue && (
        <div className="rounded-lg p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <p className="text-sm mb-3" style={{ color: C.inkSoft }}>{matching.length} vistoria(s) encontrada(s) para "{filterValue}".</p>
          <button onClick={() => downloadReport(filterValue, matching)} disabled={!matching.length}
            className="w-full flex items-center justify-center gap-2 rounded-md py-3 font-semibold text-white"
            style={{ background: C.brand, opacity: matching.length ? 1 : 0.5 }}>
            <FileDown size={16} /> Baixar relatório ({matching.length} vistoria{matching.length !== 1 ? "s" : ""})
          </button>
          <p className="text-xs mt-2 text-center" style={{ color: C.inkSoft }}>
            Baixa um arquivo. Abra-o no navegador e use Ctrl+P (ou Cmd+P) → "Salvar como PDF".
          </p>
        </div>
      )}
    </div>
  );
}
