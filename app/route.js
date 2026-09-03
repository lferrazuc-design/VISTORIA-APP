import { NextResponse } from "next/server";
import { withClient, ensureTable } from "@/lib/db";
import { computeVisitScores } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigoFazenda = searchParams.get("codigoFazenda");
    const fornecedor = searchParams.get("fornecedor");

    const visitas = await withClient(async (client) => {
      await ensureTable(client);
      let result;
      if (codigoFazenda) {
        result = await client.sql`SELECT * FROM visitas WHERE codigo_fazenda = ${codigoFazenda} ORDER BY timestamp DESC`;
      } else if (fornecedor) {
        result = await client.sql`SELECT * FROM visitas WHERE fornecedor = ${fornecedor} ORDER BY timestamp DESC`;
      } else {
        result = await client.sql`SELECT * FROM visitas ORDER BY timestamp DESC LIMIT 500`;
      }
      return result.rows.map(rowToVisit);
    });

    return NextResponse.json({ visitas });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Falha ao buscar vistorias." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { codigoFazenda, nomeFazenda, talhao, tecnico, fornecedor, itens, overrides, obsGerais } = body;

    if (!codigoFazenda || !nomeFazenda || !tecnico || !fornecedor || !itens) {
      return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
    }

    const { notas, scores, notaFinal } = computeVisitScores(itens, overrides || {});
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const dataVisita = new Date(timestamp).toLocaleDateString("pt-BR");

    await withClient(async (client) => {
      await ensureTable(client);
      await client.sql`
        INSERT INTO visitas (id, timestamp, data_visita, codigo_fazenda, nome_fazenda, talhao, tecnico, fornecedor, itens, notas, scores, nota_final, obs_gerais)
        VALUES (
          ${id}, ${timestamp}, ${dataVisita}, ${codigoFazenda}, ${nomeFazenda}, ${talhao || ""},
          ${tecnico}, ${fornecedor}, ${JSON.stringify(itens)}, ${JSON.stringify(notas)},
          ${JSON.stringify(scores)}, ${notaFinal}, ${obsGerais || ""}
        )
      `;
    });

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
