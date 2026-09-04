import { NextResponse } from "next/server";
import { getPool, ensureTable } from "@/lib/db";
import { computeVisitScores } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await ensureTable();
    const pool = getPool();
    const { searchParams } = new URL(request.url);
    const codigoFazenda = searchParams.get("codigoFazenda");
    const fornecedor = searchParams.get("fornecedor");

    let result;
    if (codigoFazenda) {
      result = await pool.query("SELECT * FROM visitas WHERE codigo_fazenda = $1 ORDER BY timestamp DESC", [codigoFazenda]);
    } else if (fornecedor) {
      result = await pool.query("SELECT * FROM visitas WHERE fornecedor = $1 ORDER BY timestamp DESC", [fornecedor]);
    } else {
      result = await pool.query("SELECT * FROM visitas ORDER BY timestamp DESC LIMIT 500");
    }

    const visitas = result.rows.map(rowToVisit);
    return NextResponse.json({ visitas });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Falha ao buscar vistorias." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureTable();
    const pool = getPool();
    const body = await request.json();
    const { codigoFazenda, nomeFazenda, talhao, tecnico, fornecedor, itens, overrides, obsGerais } = body;

    if (!codigoFazenda || !nomeFazenda || !tecnico || !fornecedor || !itens) {
      return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
    }

    const { notas, scores, notaFinal } = computeVisitScores(itens, overrides || {});
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const dataVisita = new Date(timestamp).toLocaleDateString("pt-BR");

    await pool.query(
      `INSERT INTO visitas (id, timestamp, data_visita, codigo_fazenda, nome_fazenda, talhao, tecnico, fornecedor, itens, notas, scores, nota_final, obs_gerais)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [id, timestamp, dataVisita, codigoFazenda, nomeFazenda, talhao || "", tecnico, fornecedor,
        JSON.stringify(itens), JSON.stringify(notas), JSON.stringify(scores), notaFinal, obsGerais || ""]
    );

    return NextResponse.json({
      visita: { id, timestamp, dataVisita, codigoFazenda, nomeFazenda, talhao, tecnico, fornecedor, itens, notas, scores, notaFinal, obsGerais },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Falha ao salvar vistoria." }, { status: 500 });
  }
}

function rowToVisit(row) {
  return {
    id: row.id,
    timestamp: Number(row.timestamp),
    dataVisita: row.data_visita,
    codigoFazenda: row.codigo_fazenda,
    nomeFazenda: row.nome_fazenda,
    talhao: row.talhao,
    tecnico: row.tecnico,
    fornecedor: row.fornecedor,
    itens: row.itens,
    notas: row.notas,
    scores: row.scores,
    notaFinal: row.nota_final,
    obsGerais: row.obs_gerais,
  };
}
