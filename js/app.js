// ==========================================================
// GVC Analytics — Vendas | Funções de renderização
// Arquivo: js/app.js
// Contém: todas as funções de renderização de cada aba
//   (Consolidado, Seller, Gestor, Pipeline, Origem, Porte,
//    Tipo de Negócio, Evolutivo, Marcadores) e exportação
//    WhatsApp via html2canvas.
// Depende de: config.js (AppState, constantes, utilitários)
// ==========================================================
// ════════════════════════════════════════════════════════
// RENDER FUNCTIONS
// ════════════════════════════════════════════════════════
function renderConsolidado() {
  const fd = AppState.filteredData;
  const no = AppState.rawData.length === 0;
  const ganhos = fd.filter((r) => r.status === "ganho");
  const perdidos = fd.filter((r) => r.status === "perdido");
  const pipeline = fd.filter((r) => r.status === "pipeline");
  const from = AppState.filters.dateFrom,
    to = AppState.filters.dateTo;
  const months = monthsInRange(from.substring(0, 7), to.substring(0, 7));
  const numMonths = months.length;
  const totalVendas = ganhos.reduce((s, r) => s + r.valor, 0);
  const totalMeta = getMetaTime(from, to);
  const pctMeta = totalMeta > 0 ? (totalVendas / totalMeta) * 100 : 0;
  const totalPipe = pipeline.reduce((s, r) => s + r.prop, 0);
  const total = ganhos.length + perdidos.length;
  const conversao = total > 0 ? (ganhos.length / total) * 100 : 0;
  const ticketMedio = ganhos.length > 0 ? totalVendas / ganhos.length : 0;

  // [A1.1] Forecast banner — pipeline deals in Forcast/Forecast stage
  const fcDeals = AppState.rawData.filter((r) => {
    const e = (r.etapa || "").toLowerCase();
    return (
      (e.includes("forcast") || e.includes("forecast")) &&
      r.status === "pipeline"
    );
  });
  const fcVal = fcDeals.reduce((s, r) => s + (r.prop || r.valor), 0);
  const fcPct = totalPipe > 0 ? (fcVal / totalPipe) * 100 : 0;
  const curMonthKey = `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}`;
  const metaMes = META_TIME_MES;
  const vendMesAtual = ganhos
    .filter((r) => r.monthKey === curMonthKey)
    .reduce((s, r) => s + r.valor, 0);
  const gapMes = Math.max(0, metaMes - vendMesAtual);
  const fcCoberta = gapMes > 0 ? (fcVal / gapMes) * 100 : 100;
  const ganhoForecast = vendMesAtual + fcVal;
  const fcEl = document.getElementById("cons-forecast");
  if (no) {
    fcEl.innerHTML = "";
  } else {
    fcEl.innerHTML = `<div class="fc-banner mb12">
      <div style="flex:1">
        <div class="fc-label">Forecast no Pipeline — Mês Atual</div>
        <div class="fc-val">${fmt(fcVal)}</div>
        <div style="font-family:'Poppins';font-size:11px;color:var(--text2)">${fcDeals.length} leads em estágio Forecast</div>
      </div>
      <div class="fc-stat"><div class="fc-stat-val">${fmtPct(fcPct)}</div><div style="font-family:'Poppins';font-size:10px;color:var(--text3)">% do Funil Total</div></div>
      <div class="fc-stat" style="border-left:1px solid var(--info);padding-left:16px">
        <div style="font-family:'Poppins';font-size:9px;color:var(--info);text-transform:uppercase;letter-spacing:.5px">GANHO + FORECAST</div>
        <div style="font-family:'Poppins';font-size:28px;color:var(--info);letter-spacing:1px">${fmt(ganhoForecast)}</div>
        <div style="font-family:'Poppins';font-size:10px;color:var(--text3)">Vendido+Forecast vs Meta ${fmt(metaMes)} · ${fmtPct(metaMes > 0 ? (ganhoForecast / metaMes) * 100 : 0)}</div>
      </div>
    </div>`;
  }

  // [A1.2] 3 Meta cards — Mês Atual / Meses Fechados / YTD
  function metaCardData(label, cls, dataSet, metaVal, accentColor) {
    const v = dataSet.reduce((s, r) => s + r.valor, 0);
    const p = metaVal > 0 ? (v / metaVal) * 100 : 0;
    const col = gaugeColor(p);
    return `<div class="meta-card ${cls}">
      <div class="meta-card-lbl">${label}</div>
      <div style="font-family:'Poppins';font-size:36px;letter-spacing:1px;color:${accentColor};line-height:1">${fmt(v)}</div>
      <div style="font-family:'Poppins';font-size:12px;color:var(--text2);margin-top:2px">Meta: ${fmt(metaVal)}</div>
      <div style="font-family:'Poppins';font-size:20px;color:${col};margin-top:2px">${fmtPct(p)}</div>
      <div class="prog" style="margin-top:6px"><div class="prog-fill" style="width:${Math.min(100, p).toFixed(1)}%;background:${accentColor}"></div></div>
    </div>`;
  }
  const allRaw = AppState.rawData;
  const gAtual = allRaw.filter(
    (r) => r.status === "ganho" && r.monthKey === curMonthKey,
  );
  const closedMonths = monthsInRange(
    `${CURRENT_YEAR}-01`,
    `${CURRENT_YEAR}-${String(CURRENT_MONTH - 1).padStart(2, "0")}`,
  ).filter((m) => m < curMonthKey);
  const gFechados = allRaw.filter(
    (r) => r.status === "ganho" && closedMonths.includes(r.monthKey),
  );
  const gYTD = allRaw.filter(
    (r) =>
      r.status === "ganho" &&
      r.monthKey &&
      r.monthKey.startsWith(String(CURRENT_YEAR)),
  );
  // AJUSTE V4 – Card Mês Anterior (Consolidado)
  const prevMonthNum = CURRENT_MONTH === 1 ? 12 : CURRENT_MONTH - 1;
  const prevMonthYear = CURRENT_MONTH === 1 ? CURRENT_YEAR - 1 : CURRENT_YEAR;
  const prevMonthKey = `${prevMonthYear}-${String(prevMonthNum).padStart(2, "0")}`;
  const gPrevMes = allRaw.filter(
    (r) => r.status === "ganho" && r.monthKey === prevMonthKey,
  );
  const prevMonthName = MONTH_NAMES[prevMonthNum - 1];
  const mcEl = document.getElementById("cons-meta-cards");
  mcEl.innerHTML =
    metaCardData("Mês Atual", "atual", gAtual, metaMes, "#bcd6ff") +
    metaCardData(
      `Mês Anterior (${prevMonthName})`,
      "anterior",
      gPrevMes,
      metaMes,
      "#d9c8ff",
    ) +
    metaCardData(
      "Meses Fechados",
      "fechado",
      gFechados,
      metaMes * Math.max(0, CURRENT_MONTH - 1),
      "#9effd4",
    ) +
    metaCardData("YTD 2026", "ytd", gYTD, metaMes * CURRENT_MONTH, "#ffd79e");

  if (no) {
    [
      "cons-mix-table",
      "cons-origens-table",
      "cons-funil-viz",
      "cons-porte-viz",
      "cons-ranking-top5",
      "cons-ganhos-recentes",
      "cons-motivos",
      "cons-quarentena",
      "cons-consultor-table",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = noDataHtml();
    });
    document.getElementById("cons-gauge").innerHTML = "";
    document.getElementById("cons-kpis").innerHTML = noDataHtml();
    return;
  }

  // [A1.3] Mix de Produtos — DATA TABLE
  const produtos = ["RSS", "Gerenciamento", "Consultoria"];
  const mixEl = document.getElementById("cons-mix-table");
  const metaTimeProd = (p) =>
    Object.values(METAS_CONSULTOR).reduce((s, m) => s + (m[p] || 0), 0) *
    numMonths;
  mixEl.innerHTML =
    `<table class="dt"><thead><tr><th>Produto</th><th class="num">Realizado</th><th class="num">Meta</th><th class="num">% Ating.</th></tr></thead><tbody>` +
    produtos
      .map((p) => {
        const v = ganhos
          .filter((r) => r.produto === p)
          .reduce((s, r) => s + r.valor, 0);
        const m = metaTimeProd(p);
        const pct = m > 0 ? (v / m) * 100 : 0;
        return `<tr><td class="hl">${p}</td><td class="num">${fmt(v)}</td><td class="num">${fmt(m)}</td><td class="num">${pctBadge(pct)}</td></tr>`;
      })
      .join("") +
    `<tr style="border-top:1px solid var(--border-soft)"><td><strong>TOTAL</strong></td><td class="num"><strong>${fmt(totalVendas)}</strong></td><td class="num"><strong>${fmt(totalMeta)}</strong></td><td class="num">${pctBadge(pctMeta)}</td></tr>` +
    `</tbody></table>`;

  // [A1.4] Top Origens — table with meta, % atingimento and representatividade
  const oriEl = document.getElementById("cons-origens-table");
  const oriMap = {};
  ganhos.forEach((r) => {
    const o = r.origem || "(sem origem)";
    oriMap[o] = (oriMap[o] || 0) + r.valor;
  });
  oriEl.innerHTML =
    `<table class="dt"><thead><tr><th>Origem</th><th class="num">Realizado</th><th class="num">Meta (Período)</th><th class="num">% Ating.</th><th class="num">Rep.%</th></tr></thead><tbody>` +
    METAS_ORIGEM.map((m) => {
      const v = oriMap[m.origem] || 0;
      const metaPeriodo = m.total * numMonths;
      const pct = metaPeriodo > 0 ? (v / metaPeriodo) * 100 : 0;
      return `<tr><td class="hl">${m.origem}</td><td class="num">${fmt(v)}</td><td class="num">${fmt(metaPeriodo)}</td><td class="num">${pctBadge(pct)}</td><td class="num" style="color:var(--text3)">${m.pct}%</td></tr>`;
    }).join("") +
    `</tbody></table>`;

  // Gauge — % Sobre a Meta Anual 2026 (YTD, unfiltered)
  const gEl = document.getElementById("cons-gauge");
  const ytdG = AppState.rawData.filter(
    (r) =>
      r.status === "ganho" &&
      r.monthKey &&
      r.monthKey.startsWith(String(CURRENT_YEAR)),
  );
  const ytdVendas = ytdG.reduce((s, r) => s + r.valor, 0);
  const ytdMeta = META_TIME_MES * CURRENT_MONTH;
  const ytdPct = ytdMeta > 0 ? (ytdVendas / ytdMeta) * 100 : 0;
  gEl.innerHTML =
    `<div class="card-title" style="text-align:center">% Sobre a Meta Anual 2026</div>` +
    buildGaugeSVG(ytdPct, null, "170px") +
    `<div style="text-align:center;padding:4px 8px">
      <div style="font-family:'Poppins';font-size:11px;color:var(--text2)">Vendas Acumuladas: <strong style="color:var(--text)">${fmt(ytdVendas)}</strong></div>
      <div style="font-family:'Poppins';font-size:11px;color:var(--text2)">Meta Acumulada 2026: <strong style="color:var(--warn)">${fmt(ytdMeta)}</strong></div>
      <div class="gauge-label" style="margin-top:4px">YTD 2026 · Não afetado por filtros</div>
    </div>`;

  // Charts
  // STATIC: Charts always show full year 2026, not affected by filters
  const allMonths2026 = [
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09",
    "2026-10",
    "2026-11",
    "2026-12",
  ];
  const staticLabels = allMonths2026.map((mk) => {
    const [y, m] = mk.split("-");
    return MONTH_NAMES[parseInt(m) - 1].substring(0, 3) + "/" + y.substring(2);
  });
  const allGanhos2026Static = AppState.rawData.filter(
    (r) => r.status === "ganho" && r.monthKey && r.monthKey.startsWith("2026"),
  );
  const vendasMesStatic = allMonths2026.map((mk) =>
    allGanhos2026Static
      .filter((r) => r.monthKey === mk)
      .reduce((s, r) => s + r.valor, 0),
  );
  const metaMes2Static = allMonths2026.map(() => META_TIME_MES);
  dc("chart-main");
  const ctxM = document.getElementById("chart-main");
  if (ctxM)
    new Chart(ctxM, {
      type: "line",
      data: {
        labels: staticLabels,
        datasets: [
          {
            label: "Vendas 2026",
            data: vendasMesStatic,
            borderColor: "#bcd6ff",
            backgroundColor: "rgba(188,214,255,.1)",
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: "#bcd6ff",
          },
          {
            label: "Meta",
            data: metaMes2Static,
            borderColor: "#ffd79e",
            borderDash: [5, 4],
            backgroundColor: "transparent",
            tension: 0,
            pointRadius: 0,
          },
        ],
      },
      options: {
        ...chartDefaults(),
        plugins: {
          ...chartDefaults().plugins,
          title: {
            display: true,
            text: "Vendas vs Meta 2026 — Estático, não afetado por filtros",
            color: "rgba(255,255,255,.45)",
            font: { size: 9 },
          },
          tooltip: {
            callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.raw)}` },
          },
        },
      },
    });

  const allFd2026Static = AppState.rawData.filter(
    (r) => r.monthKey && r.monthKey.startsWith("2026"),
  );
  const convMesStatic = allMonths2026.map((mk) => {
    const g = allFd2026Static.filter(
      (r) => r.status === "ganho" && r.monthKey === mk,
    ).length;
    const p = allFd2026Static.filter(
      (r) => r.status === "perdido" && r.monthKey === mk,
    ).length;
    return g + p > 0 ? (g / (g + p)) * 100 : 0;
  });
  dc("chart-conv");
  const ctxC = document.getElementById("chart-conv");
  if (ctxC)
    new Chart(ctxC, {
      type: "line",
      data: {
        labels: staticLabels,
        datasets: [
          {
            label: "Conversão % 2026",
            data: convMesStatic,
            borderColor: "#9effd4",
            backgroundColor: "rgba(158,255,212,.1)",
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: "#9effd4",
          },
        ],
      },
      options: {
        ...chartDefaults(),
        plugins: {
          ...chartDefaults().plugins,
          title: {
            display: true,
            text: "Conversão 2026 — Estático, não afetado por filtros",
            color: "rgba(255,255,255,.45)",
            font: { size: 9 },
          },
          tooltip: { callbacks: { label: (c) => `${fmtPct(c.raw)}` } },
        },
        scales: {
          ...chartDefaults().scales,
          y: {
            ...chartDefaults().scales.y,
            max: 100,
            ticks: {
              ...chartDefaults().scales.y.ticks,
              callback: (v) => v + "%",
            },
          },
        },
      },
    });

  // [A1.5] Funil visualization — mostra qtd + valor R$ por etapa
  const fvEl = document.getElementById("cons-funil-viz");
  const etapaMap = {};
  pipeline.forEach((r) => {
    const e = r.etapa || "Em aberto";
    if (!etapaMap[e]) etapaMap[e] = { count: 0, valor: 0 };
    etapaMap[e].count++;
    etapaMap[e].valor += r.prop || r.valor;
  });
  const etapas = FUNIL_ORDER.filter((e) => etapaMap[e]).map((e) => ({
    e,
    d: etapaMap[e],
  }));
  Object.keys(etapaMap).forEach((e) => {
    if (!FUNIL_ORDER.includes(e)) etapas.push({ e, d: etapaMap[e] });
  });
  const maxVal = Math.max(1, ...etapas.map((x) => x.d.valor));
  // % conversão aproximada = ratio para próxima etapa visível
  fvEl.innerHTML =
    etapas
      .slice(0, 8)
      .map(({ e, d }, idx, arr) => {
        const next = arr[idx + 1];
        const convPctStr = next
          ? fmtPct((next.d.count / Math.max(1, d.count)) * 100)
          : "—";
        return `<div style="padding:5px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
        <div style="font-family:'Poppins';font-size:11px;color:var(--text2);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e}</div>
        <span style="font-family:'Poppins';font-size:10px;color:var(--text)">${d.count}</span>
        <span style="font-family:'Poppins';font-size:10px;color:var(--text3)">→ prox: ${convPctStr}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <div style="flex:1;height:5px;background:var(--bg4);border-radius:3px;overflow:hidden"><div style="height:100%;width:${((d.valor / maxVal) * 100).toFixed(0)}%;background:var(--info);border-radius:3px"></div></div>
        <span style="font-family:'Poppins';font-size:9px;color:var(--text3);min-width:70px;text-align:right">${fmt(d.valor)}</span>
      </div>
    </div>`;
      })
      .join("") +
    `<div style="margin-top:8px;padding-top:6px;border-top:1px solid var(--border-soft)">
      <div style="font-family:'Poppins';font-size:10px;color:var(--text3)">Total Pipeline: <strong style="color:var(--text)">${fmt(totalPipe)}</strong></div>
      <div class="prog" style="margin-top:5px"><div class="prog-fill pfc" style="width:${Math.min(100, pctMeta).toFixed(1)}%"></div></div>
      <div style="font-family:'Poppins';font-size:10px;color:var(--text3);margin-top:3px">Atingimento meta: ${fmtPct(pctMeta)}</div>
    </div>`;

  // [A1.6] Porte do Cliente
  const pvEl = document.getElementById("cons-porte-viz");
  const lq = ganhos.filter((r) => r.porte === "LQ"),
    sq = ganhos.filter((r) => r.porte === "SQ");
  const lqV = lq.reduce((s, r) => s + r.valor, 0),
    sqV = sq.reduce((s, r) => s + r.valor, 0),
    totV = lqV + sqV;
  const totD = lq.length + sq.length;
  const lqDpct = totD > 0 ? (lq.length / totD) * 100 : 0,
    lqVpct = totV > 0 ? (lqV / totV) * 100 : 0;
  function porteSplitBar(title, metaLabel, segA, segB, markerPct) {
    const wA = Math.max(0, Math.min(100, segA.pct)).toFixed(1);
    const wB = Math.max(0, Math.min(100, segB.pct)).toFixed(1);
    const seg = (s, w) =>
      `<div class="porte-seg" style="width:${w}%;background:${s.color};transition:width .4s">${
        s.tip ? `<span class="porte-tip">${s.tip}</span>` : ""
      }</div>`;
    return `<div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px;margin-bottom:6px">
        <span style="font-family:'Poppins';font-size:12px;color:var(--text2)">${title}</span>
        <span style="font-family:'Poppins';font-size:10px;color:var(--text3)">${metaLabel}</span>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:6px;font-family:'Poppins';font-size:11px">
        <span style="color:${segA.color};font-weight:600">${segA.label} ${fmtPct(segA.pct)}</span>
        <span style="color:${segB.color};font-weight:600">${segB.label} ${fmtPct(segB.pct)}</span>
      </div>
      <div style="position:relative;padding-top:14px">
        <div style="position:absolute;top:0;left:${markerPct}%;transform:translateX(-50%);font-family:'Poppins';font-size:9px;color:var(--text3);white-space:nowrap">▼ meta ${markerPct}%</div>
        <div class="porte-bar-track">
          ${seg(segA, wA)}${seg(segB, wB)}
          <div style="position:absolute;top:-4px;bottom:-4px;left:${markerPct}%;width:2px;background:#fff;z-index:1;pointer-events:none"></div>
        </div>
      </div>
    </div>`;
  }
  // Consolidado 2026 (unfiltered)
  const allRawForPorte = AppState.rawData;
  const ytdGPorte = allRawForPorte.filter(
    (r) => r.status === "ganho" && r.monthKey && r.monthKey.startsWith("2026"),
  );
  const ytdPorteV = ytdGPorte.reduce((s, r) => s + r.valor, 0);
  const ytdPorteN = ytdGPorte.length;
  const mesGPorte = allRawForPorte.filter(
    (r) => r.status === "ganho" && r.monthKey === curMonthKey,
  );
  const mesPorteV = mesGPorte.reduce((s, r) => s + r.valor, 0);
  const mesPorteN = mesGPorte.length;

  pvEl.innerHTML =
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border-soft)">
      <div style="background:var(--bg3);border-radius:8px;padding:8px;border-left:3px solid var(--info)">
        <div style="font-family:'Poppins';font-size:9px;color:var(--info);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">📅 Mês Atual — ${MONTH_NAMES[CURRENT_MONTH - 1]}/${CURRENT_YEAR}</div>
        <div style="font-family:'Poppins';font-size:18px;color:var(--text)">${fmt(mesPorteV)}</div>
        <div style="font-family:'Poppins';font-size:10px;color:var(--text3)">${mesPorteN} deal${mesPorteN !== 1 ? "s" : ""} ganho${mesPorteN !== 1 ? "s" : ""}</div>
      </div>
      <div style="background:var(--bg3);border-radius:8px;padding:8px;border-left:3px solid var(--warn)">
        <div style="font-family:'Poppins';font-size:9px;color:var(--warn);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">📊 Consolidado 2026</div>
        <div style="font-family:'Poppins';font-size:18px;color:var(--text)">${fmt(ytdPorteV)}</div>
        <div style="font-family:'Poppins';font-size:10px;color:var(--text3)">${ytdPorteN} deal${ytdPorteN !== 1 ? "s" : ""} ganho${ytdPorteN !== 1 ? "s" : ""}</div>
      </div>
    </div>` +
    porteSplitBar(
      "Quantitativo (nº deals)",
      "Meta: 20% LQ / 80% SQ",
      {
        pct: lqDpct,
        label: "LQ",
        color: "var(--purple)",
        tip: `${lq.length} deal${lq.length !== 1 ? "s" : ""} (${fmtPct(lqDpct)})`,
      },
      {
        pct: 100 - lqDpct,
        label: "SQ",
        color: "var(--ok)",
        tip: `${sq.length} deal${sq.length !== 1 ? "s" : ""} (${fmtPct(100 - lqDpct)})`,
      },
      20,
    ) +
    porteSplitBar(
      "Qualitativo (faturamento R$)",
      "Meta: 70% LQ / 30% SQ",
      {
        pct: lqVpct,
        label: "LQ",
        color: "var(--purple)",
        tip: `${fmt(lqV)} (${fmtPct(lqVpct)})`,
      },
      {
        pct: 100 - lqVpct,
        label: "SQ",
        color: "var(--ok)",
        tip: `${fmt(sqV)} (${fmtPct(100 - lqVpct)})`,
      },
      70,
    ) +
    `<div style="display:flex;gap:14px;padding-top:8px;margin-top:2px;border-top:1px solid var(--border-soft)">
      <span style="display:flex;align-items:center;gap:6px;font-family:'Poppins';font-size:10px;color:var(--text3)"><span style="width:9px;height:9px;border-radius:2px;background:var(--purple);display:inline-block"></span>LQ (≥R$5k)</span>
      <span style="display:flex;align-items:center;gap:6px;font-family:'Poppins';font-size:10px;color:var(--text3)"><span style="width:9px;height:9px;border-radius:2px;background:var(--ok);display:inline-block"></span>SQ (&lt;R$5k)</span>
      <span style="display:flex;align-items:center;gap:6px;font-family:'Poppins';font-size:10px;color:var(--text3)"><span style="width:2px;height:9px;background:#fff;display:inline-block"></span>marcador de meta</span>
    </div>`;

  // [A1.7] Top 5 Consultores
  const r5El = document.getElementById("cons-ranking-top5");
  const top5 = Object.keys(METAS_CONSULTOR)
    .map((s, i) => {
      const sg = ganhos.filter((r) => r.consultor === s);
      const v = sg.reduce((a, r) => a + r.valor, 0);
      const m = METAS_CONSULTOR[s].total * numMonths;
      return {
        s,
        v,
        m,
        pct: m > 0 ? (v / m) * 100 : 0,
        col: SELLER_COLORS[i % SELLER_COLORS.length],
      };
    })
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);
  const medals = ["🥇", "🥈", "🥉", "4", "5"];
  r5El.innerHTML = top5
    .map(
      (r, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:${i < 3 ? "16" : "13"}px;width:20px;text-align:center;font-family:'Poppins'">${medals[i]}</div>
      <div style="flex:1">
        <div style="font-family:'Poppins';font-size:12px;color:var(--text)">${r.s.split(" ")[0]}</div>
        <div style="font-size:10px;color:var(--text3)">${r.s}</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:'Poppins';font-size:11px;color:${r.col}">${fmt(r.v)}</div>
        <div>${pctBadge(r.pct)}</div>
      </div>
    </div>`,
    )
    .join("");

  // [A1.8] Ganhos recentes
  const grEl = document.getElementById("cons-ganhos-recentes");
  const recentes = ganhos
    .filter((r) => r.data)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 10);
  if (recentes.length) {
    grEl.innerHTML =
      `<table class="dt"><thead><tr><th>Cliente</th><th>Produto</th><th>Consultor</th><th class="num">Valor</th><th>Origem</th><th>Porte</th><th>Data</th></tr></thead><tbody>` +
      recentes
        .map(
          (r) => `<tr>
        <td class="hl">${(r.cliente || "—").substring(0, 30)}</td>
        <td><span class="badge bc">${r.produto}</span></td>
        <td>${(r.consultor || "—").split(" ")[0]}</td>
        <td class="num">${fmt(r.valor)}</td>
        <td>${(r.origem || "—").substring(0, 18)}</td>
        <td><span class="badge ${r.porte === "LQ" ? "bb" : "bg"}">${r.porte}</span></td>
        <td>${r.data || "—"}</td>
      </tr>`,
        )
        .join("") +
      `</tbody></table>`;
  } else grEl.innerHTML = noDataHtml("Nenhum negócio ganho no período");

  // [A1.9] Motivos — with valor
  const motEl = document.getElementById("cons-motivos");
  const motivoMap = {};
  perdidos.forEach((r) => {
    const m = r.motivoPerda || "(não informado)";
    if (!motivoMap[m]) motivoMap[m] = { count: 0, valor: 0 };
    motivoMap[m].count++;
    motivoMap[m].valor += r.valor;
  });
  const topM = Object.entries(motivoMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);
  if (topM.length) {
    const mTotQtd = topM.reduce((s, [, d]) => s + d.count, 0);
    const mTotVal = topM.reduce((s, [, d]) => s + d.valor, 0);
    motEl.innerHTML =
      `<table class="dt"><thead><tr><th>#</th><th>Motivo</th><th class="num">Qtd</th><th class="num">Valor Perda</th><th class="num">%</th></tr></thead><tbody>` +
      topM
        .map(
          ([m, d], i) =>
            `<tr><td>${i + 1}</td><td class="hl">${m}</td><td class="num">${d.count}</td><td class="num">${fmt(d.valor)}</td><td class="num">${fmtPct(perdidos.length > 0 ? (d.count / perdidos.length) * 100 : 0)}</td></tr>`,
        )
        .join("") +
      `<tr style="border-top:2px solid var(--border-soft);background:rgba(255,255,255,.04)"><td></td><td><strong style="color:var(--text)">TOTAL</strong></td><td class="num"><strong>${mTotQtd}</strong></td><td class="num"><strong>${fmt(mTotVal)}</strong></td><td class="num"><strong>100%</strong></td></tr>` +
      `</tbody></table>`;
  } else motEl.innerHTML = noDataHtml("Nenhum negócio perdido");

  // [A1.10] Quarentena
  const qEl = document.getElementById("cons-quarentena");
  const qar = pipeline
    .filter((r) => r.dias > 30)
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 10);
  if (qar.length) {
    const qTotVal = qar.reduce((s, r) => s + (r.prop || r.valor), 0);
    const qTotPct = qar.length > 0 ? 100 : 0;
    qEl.innerHTML =
      `<table class="dt"><thead><tr><th>Cliente</th><th>Consultor</th><th>Etapa</th><th class="num">Proposta</th><th class="num">Dias</th><th>Alerta</th></tr></thead><tbody>` +
      qar
        .map(
          (r) =>
            `<tr><td class="hl">${r.cliente || "—"}</td><td>${r.consultor || "—"}</td><td>${r.etapa || "—"}</td><td class="num">${fmt(r.prop || r.valor)}</td><td class="num" style="color:var(--bad)">${r.dias || 0}d</td><td>${alertaBadge(r.alerta, r.dias)}</td></tr>`,
        )
        .join("") +
      `<tr style="border-top:2px solid var(--border-soft);background:rgba(255,255,255,.04)"><td><strong style="color:var(--text)">TOTAL</strong></td><td></td><td></td><td class="num"><strong>${fmt(qTotVal)}</strong></td><td class="num"><strong>${qar.length} leads</strong></td><td></td></tr>` +
      `</tbody></table>`;
  } else qEl.innerHTML = noDataHtml("Nenhum lead em quarentena");

  // Forecast table — deals in Forecast stage (all pipeline data, not filtered)
  const ftEl = document.getElementById("cons-forecast-table");
  if (ftEl) {
    const curMK2 = `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}`;
    const allFC = AppState.rawData.filter((r) => {
      const e = (r.etapa || "").toLowerCase();
      return (
        (e.includes("forcast") || e.includes("forecast")) &&
        r.status === "pipeline"
      );
    });
    if (allFC.length) {
      ftEl.innerHTML =
        `<table class="dt"><thead><tr>
        <th>Cliente</th><th>Consultor</th><th>Tipo</th><th class="num">Valor Proposta</th><th>Origem</th><th class="num">Dias Parados</th><th>Status</th><th>Marcadores</th>
      </tr></thead><tbody>` +
        allFC
          .sort((a, b) => (b.prop || b.valor) - (a.prop || a.valor))
          .map((r) => {
            const isOld = r.monthKey && r.monthKey < curMK2;
            const rowStyle = isOld ? "background:rgba(255,75,106,.07);" : "";
            const alertBadge = isOld
              ? `<span class="badge br">⚠️ Mês anterior</span>`
              : `<span class="badge bc">Em aberto</span>`;
            return `<tr style="${rowStyle}">
          <td class="hl">${(r.cliente || "—").substring(0, 28)}</td>
          <td>${(r.consultor || "—").split(" ")[0]}</td>
          <td><span class="badge bc">${r.produto}</span></td>
          <td class="num">${fmt(r.prop || r.valor)}</td>
          <td>${(r.origem || "—").substring(0, 18)}</td>
          <td class="num" style="color:${r.dias > 30 ? "var(--bad)" : r.dias > 15 ? "var(--warn)" : "var(--text2)"}">${r.dias || 0}d</td>
          <td>${alertBadge}</td>
          <td style="font-size:10px;color:var(--text3)">${r.marcadores || "—"}</td>
        </tr>`;
          })
          .join("") +
        `<tr style="border-top:2px solid var(--border-soft);font-weight:700"><td><strong>TOTAL</strong></td><td></td><td></td>
        <td class="num"><strong>${fmt(allFC.reduce((s, r) => s + (r.prop || r.valor), 0))}</strong></td>
        <td></td><td class="num"><strong>${(allFC.reduce((s, r) => s + (r.dias || 0), 0) / Math.max(1, allFC.length)).toFixed(0)}d avg</strong></td><td></td>
      </tr>` +
        `</tbody></table>`;
    } else {
      ftEl.innerHTML = noDataHtml("Nenhum negócio em estágio Forecast");
    }
  }

  // [A1.10] Performance por consultor
  const sellers = Object.keys(METAS_CONSULTOR);
  const cEl = document.getElementById("cons-consultor-table");
  const cRows = sellers
    .map((s) => {
      const sg = ganhos.filter((r) => r.consultor === s),
        sp = perdidos.filter((r) => r.consultor === s);
      const v = sg.reduce((a, r) => a + r.valor, 0),
        m = METAS_CONSULTOR[s].total * numMonths;
      const pct = m > 0 ? (v / m) * 100 : null,
        conv =
          sg.length + sp.length > 0
            ? (sg.length / (sg.length + sp.length)) * 100
            : 0;
      return {
        s,
        v,
        m,
        pct,
        g: sg.length,
        p: sp.length,
        conv,
        ticket: sg.length > 0 ? v / sg.length : 0,
      };
    })
    .sort((a, b) => b.v - a.v);
  const cTotV = cRows.reduce((s, r) => s + r.v, 0),
    cTotM = cRows.reduce((s, r) => s + r.m, 0),
    cTotG = cRows.reduce((s, r) => s + r.g, 0),
    cTotP = cRows.reduce((s, r) => s + r.p, 0);
  const cTotPct = cTotM > 0 ? (cTotV / cTotM) * 100 : 0,
    cTotConv = cTotG + cTotP > 0 ? (cTotG / (cTotG + cTotP)) * 100 : 0;
  cEl.innerHTML =
    `<table class="dt"><thead><tr><th>#</th><th>Consultor</th><th class="num">Vendas</th><th class="num">Meta</th><th class="num">% Ating.</th><th class="num">Ganhas</th><th class="num">Perdidas</th><th class="num">Conv.</th><th class="num">Ticket</th></tr></thead><tbody>` +
    cRows
      .map(
        (r, i) =>
          `<tr><td>${i + 1}</td><td class="hl">${r.s}</td><td class="num">${fmt(r.v)}</td><td class="num">${fmt(r.m)}</td><td class="num">${r.pct === null ? '<span class="badge">N/D</span>' : pctBadge(r.pct)}</td><td class="num">${r.g}</td><td class="num">${r.p}</td><td class="num">${fmtPct(r.conv)}</td><td class="num">${fmt(r.ticket)}</td></tr>`,
      )
      .join("") +
    `<tr style="border-top:2px solid var(--border-soft);font-weight:700"><td></td><td><strong>TOTAL</strong></td><td class="num"><strong>${fmt(cTotV)}</strong></td><td class="num"><strong>${fmt(cTotM)}</strong></td><td class="num">${pctBadge(cTotPct)}</td><td class="num"><strong>${cTotG}</strong></td><td class="num"><strong>${cTotP}</strong></td><td class="num"><strong>${fmtPct(cTotConv)}</strong></td><td></td></tr>` +
    `</tbody></table>`;

  // KPIs row
  document.getElementById("cons-kpis").innerHTML = [
    kpiCard(
      "Vendas Acumuladas",
      fmt(totalVendas),
      `Meta: ${fmt(totalMeta)}`,
      "c",
      pctMeta,
    ),
    kpiCard(
      "Meta Acumulada",
      fmt(totalMeta),
      fmtPct(pctMeta) + " atingido",
      "gold",
      pctMeta,
    ),
    kpiCard(
      "Conversão Geral",
      fmtPct(conversao),
      `${ganhos.length}G / ${total} total`,
      "g",
      conversao,
    ),
    kpiCard(
      "Ticket Médio",
      fmt(ticketMedio),
      `${ganhos.length} negócios ganhos`,
      "b",
    ),
    kpiCard(
      "Não Conversão",
      fmtN(perdidos.length),
      `Pipeline: ${pipeline.length} deals`,
      "r",
    ),
  ].join("");
}
function renderRanking() {
  if (AppState.rawData.length === 0) {
    document.getElementById("rank-table").innerHTML = noDataHtml();
    document.getElementById("rank-gauges").innerHTML = "";
    document.getElementById("rank-alertas").innerHTML = "";
    return;
  }
  const fd = AppState.filteredData;
  const ganhos = fd.filter((r) => r.status === "ganho");
  const perdidos = fd.filter((r) => r.status === "perdido");
  const from = AppState.filters.dateFrom,
    to = AppState.filters.dateTo;
  const months = monthsInRange(from.substring(0, 7), to.substring(0, 7));
  const numMonths = months.length;
  // Dias restantes no mês atual
  const endOfMonth = new Date(CURRENT_YEAR, CURRENT_MONTH, 0);
  const daysLeft = Math.max(
    0,
    Math.ceil((endOfMonth - TODAY) / (1000 * 60 * 60 * 24)),
  );

  const rows = Object.keys(METAS_CONSULTOR)
    .map((s, i) => {
      // [A2.1] Aggregation fix: sum ALL ganhos of consultor in period
      const sg = ganhos.filter((r) => r.consultor === s);
      const sp = perdidos.filter((r) => r.consultor === s);
      const v = sg.reduce((a, r) => a + r.valor, 0);
      const m = METAS_CONSULTOR[s].total * numMonths;
      const pct = m > 0 ? (v / m) * 100 : 0;
      const conv =
        sg.length + sp.length > 0
          ? (sg.length / (sg.length + sp.length)) * 100
          : 0;
      const ticket = sg.length > 0 ? v / sg.length : 0;
      const status = pct >= 90 ? "🟢" : pct >= 70 ? "🟡" : "🔴";
      return {
        pos: 0,
        s,
        v,
        m,
        metaMes: METAS_CONSULTOR[s].total,
        pct,
        conv,
        ticket,
        status,
        col: SELLER_COLORS[i % SELLER_COLORS.length],
        daysLeft,
        ganhas: sg.length,
        perdidas: sp.length,
      };
    })
    .sort((a, b) => b.v - a.v)
    .map((r, i) => ({ ...r, pos: i + 1 }));

  // [A2.1] Table — no Empresa column
  const rkTotV = rows.reduce((s, r) => s + r.v, 0),
    rkTotM = rows.reduce((s, r) => s + r.m, 0);
  const rkTotG = rows.reduce((s, r) => s + r.ganhas, 0),
    rkTotP = rows.reduce((s, r) => s + r.perdidas, 0);
  document.getElementById("rank-table").innerHTML =
    `<table class="dt"><thead><tr><th>Pos</th><th>Consultor</th><th class="num">Vendas Totais</th><th class="num">Meta/Mês</th><th class="num">Atingimento</th><th class="num">Conversão</th><th class="num">Ticket</th><th>Status</th></tr></thead><tbody>` +
    rows
      .map(
        (r) => `<tr>
      <td><strong style="color:${r.col}">#${r.pos}</strong></td>
      <td class="hl">${r.s}</td>
      <td class="num">${fmt(r.v)}</td>
      <td class="num">${fmt(r.metaMes)}</td>
      <td class="num">${pctBadge(r.pct)}</td>
      <td class="num">${fmtPct(r.conv)}</td>
      <td class="num">${fmt(r.ticket)}</td>
      <td>${r.status}</td>
    </tr>`,
      )
      .join("") +
    `<tr style="border-top:2px solid var(--border-soft);font-weight:700"><td></td><td><strong>TOTAL</strong></td><td class="num"><strong>${fmt(rkTotV)}</strong></td><td class="num"><strong>${fmt(rkTotM)}</strong></td><td class="num">${pctBadge(rkTotM > 0 ? (rkTotV / rkTotM) * 100 : 0)}</td><td class="num"><strong>${fmtPct(rkTotG + rkTotP > 0 ? (rkTotG / (rkTotG + rkTotP)) * 100 : 0)}</strong></td><td></td><td></td></tr>` +
    `</tbody></table>`;

  // [A2.2] Gauges — cyan≥70%, gold 40-69%, red <40%
  document.getElementById("rank-gauges").innerHTML = rows
    .map((r) => {
      const col = gaugeColor(r.pct);
      const falta = Math.max(0, r.m - r.v);
      const sub = falta > 0 ? `Faltam ${fmt(falta)}` : "✅ Meta superada";
      return `<div class="card gauge-wrap" style="border-color:${col}33;overflow:visible;min-height:170px;display:flex;flex-direction:column;align-items:center;justify-content:center">
      <div style="font-family:'Poppins';font-size:12px;color:var(--text2);margin-bottom:4px;text-align:center">${r.s.split(" ")[0]}</div>
      <div style="width:100%;overflow:visible;padding:0 4px">${buildGaugeSVG(r.pct, `${fmt(r.v)}`, null)}</div>
      <div style="font-family:'Poppins';font-size:9px;color:var(--text3);margin-top:2px;text-align:center">${fmt(r.m)} meta</div>
      <div style="font-size:9px;color:${col};margin-top:4px;font-family:'Poppins';text-align:center">${sub}</div>
    </div>`;
    })
    .join("");

  // [A2.3] Alertas automáticos
  const alertasEl = document.getElementById("rank-alertas");
  alertasEl.innerHTML = rows
    .map((r) => {
      let msg = "",
        cls = "green";
      if (r.pct >= 90) {
        msg = `✅ ${r.s.split(" ")[0]}: ${fmtPct(r.pct)} — No ritmo para bater a meta.`;
      } else if (r.pct >= 70) {
        const gap = Math.max(0, r.m - r.v);
        const needed = r.daysLeft > 0 ? gap / r.daysLeft : gap;
        msg = `🟡 ${r.s.split(" ")[0]}: ${fmtPct(r.pct)} atingido. Faltam ${fmt(gap)} · Necessário ${fmt(needed)}/dia (${r.daysLeft}d restantes).`;
        cls = "gold";
      } else {
        const gap = Math.max(0, r.m - r.v);
        const needed = r.daysLeft > 0 ? gap / r.daysLeft : gap;
        msg = `🔴 ${r.s.split(" ")[0]}: apenas ${fmtPct(r.pct)} atingido. Atenção: ${r.daysLeft} dias restantes, faltam ${fmt(gap)} (${fmt(needed)}/dia).`;
        cls = "red";
      }
      return `<div class="alert-row ${cls}">${msg}</div>`;
    })
    .join("");
}

function renderFunil() {
  if (AppState.rawData.length === 0) {
    ["funil-kpis", "funil-table", "funil-motivos", "funil-pipeline"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = noDataHtml();
      },
    );
    return;
  }
  const fd = AppState.filteredData;
  const pipeline = fd.filter((r) => r.status === "pipeline");
  const ganhos = fd.filter((r) => r.status === "ganho");
  const perdidos = fd.filter((r) => r.status === "perdido");
  const totalPipe = pipeline.reduce((s, r) => s + (r.prop || r.valor), 0);

  // KPIs
  document.getElementById("funil-kpis").innerHTML = [
    kpiCard(
      "Total Pipeline",
      fmt(totalPipe),
      `${pipeline.length} negócios`,
      "c",
    ),
    kpiCard(
      "Negócios Ganhos",
      fmt(ganhos.reduce((s, r) => s + r.valor, 0)),
      `${ganhos.length} deals`,
      "g",
    ),
    kpiCard(
      "Negócios Perdidos",
      fmtN(perdidos.length),
      `${fmt(perdidos.reduce((s, r) => s + r.valor, 0))} perdidos`,
      "r",
    ),
    kpiCard(
      "Total Negócios",
      fmtN(fd.length),
      `Ganhos + Perdidos + Pipeline`,
      "b",
    ),
  ].join("");

  // [A3.3] Forecast projection chart
  const from = AppState.filters.dateFrom,
    to = AppState.filters.dateTo;
  const months = monthsInRange(from.substring(0, 7), to.substring(0, 7));
  const labels = months.map((mk) => {
    const [y, m] = mk.split("-");
    return MONTH_NAMES[parseInt(m) - 1].substring(0, 3) + "/" + y.substring(2);
  });
  const curMK = `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}`;
  const fcVal = pipeline
    .filter((r) => {
      const e = (r.etapa || "").toLowerCase();
      return e.includes("forcast") || e.includes("forecast");
    })
    .reduce((s, r) => s + (r.prop || r.valor), 0);
  const realizadoMes = months.map((mk) =>
    ganhos.filter((r) => r.monthKey === mk).reduce((s, r) => s + r.valor, 0),
  );
  const projecaoMes = months.map((mk, i) =>
    mk === curMK ? realizadoMes[i] + fcVal : realizadoMes[i],
  );
  dc("chart-forecast");
  const ctxF = document.getElementById("chart-forecast");
  if (ctxF)
    new Chart(ctxF, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Realizado",
            data: realizadoMes,
            borderColor: "#9effd4",
            backgroundColor: "rgba(158,255,212,.1)",
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: "#9effd4",
          },
          {
            label: "Projeção (c/ Forecast)",
            data: projecaoMes,
            borderColor: "#bcd6ff",
            backgroundColor: "rgba(188,214,255,.08)",
            borderDash: [6, 3],
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointBackgroundColor: "#bcd6ff",
          },
          {
            label: "Meta",
            data: months.map(() => META_TIME_MES),
            borderColor: "#ffd79e",
            borderDash: [4, 4],
            backgroundColor: "transparent",
            tension: 0,
            pointRadius: 0,
          },
        ],
      },
      options: {
        ...chartDefaults(),
        plugins: {
          ...chartDefaults().plugins,
          tooltip: {
            callbacks: {
              title: (items) => labels[items[0].dataIndex],
              label: (ctx) => {
                const mk = months[ctx.dataIndex];
                const r = realizadoMes[ctx.dataIndex];
                if (ctx.dataset.label === "Realizado")
                  return `Realizado: ${fmt(r)}`;
                if (ctx.dataset.label === "Projeção (c/ Forecast)")
                  return [
                    `Forecast: ${fmt(fcVal)}`,
                    `Total Projetado: ${fmt(projecaoMes[ctx.dataIndex])}`,
                  ];
                return `Meta: ${fmt(META_TIME_MES)}`;
              },
            },
          },
        },
      },
    });

  // [A3.1] Etapas do funil — with benchmark and alert
  const BENCH_PCT = {
    Fechamento: 5,
    Contrato: 10,
    Forcast: 15,
    Forecast: 15,
    Negociação: 20,
    Reunião: 20,
    "Reunião Agendada": 25,
    Agendamento: 30,
    Conexão: 50,
    "Novos Leads": 100,
  };
  const etapaMap = {};
  fd.forEach((r) => {
    const e = r.etapa || "(sem etapa)";
    if (!etapaMap[e]) etapaMap[e] = { count: 0, valor: 0 };
    etapaMap[e].count++;
    etapaMap[e].valor += r.valor;
  });
  const etapas = Object.entries(etapaMap).sort(
    (a, b) => b[1].valor - a[1].valor,
  );
  const totalCount = fd.length || 1;
  const ftEl = document.getElementById("funil-table");
  ftEl.innerHTML =
    `<table class="dt"><thead><tr>
    <th>Etapa</th><th class="num">Valor Total</th><th class="num">Leads</th><th class="num">% Total</th><th class="num">Bench.%</th><th>Alerta</th>
  </tr></thead><tbody>` +
    etapas
      .map(([e, v]) => {
        const pct = (v.count / totalCount) * 100;
        const bench = BENCH_PCT[e] || null;
        let alerta = "";
        if (bench) {
          const diff = pct - bench;
          alerta =
            diff > 5
              ? `<span class="badge bg">▲ Acima</span>`
              : diff < -5
                ? `<span class="badge br">▼ Abaixo</span>`
                : `<span class="badge bc">✓ OK</span>`;
        }
        return `<tr><td class="hl">${e}</td><td class="num">${fmt(v.valor)}</td><td class="num">${v.count}</td><td class="num">${fmtPct(pct)}</td><td class="num" style="color:var(--text3)">${bench ? bench + "%" : "—"}</td><td>${alerta || "—"}</td></tr>`;
      })
      .join("") +
    (() => {
      const totVal = etapas.reduce((s, [, v]) => s + v.valor, 0);
      const totCnt = etapas.reduce((s, [, v]) => s + v.count, 0);
      return `<tr style="border-top:2px solid var(--border-soft);background:rgba(255,255,255,.04)"><td><strong style="color:var(--text)">TOTAL</strong></td><td class="num"><strong>${fmt(totVal)}</strong></td><td class="num"><strong>${totCnt}</strong></td><td class="num"><strong>100%</strong></td><td></td><td></td></tr>`;
    })() +
    `</tbody></table>`;

  // [A3.2] Motivos — with valor
  const motivoMap = {};
  perdidos.forEach((r) => {
    const m = r.motivoPerda || "(não informado)";
    if (!motivoMap[m]) motivoMap[m] = { count: 0, valor: 0 };
    motivoMap[m].count++;
    motivoMap[m].valor += r.valor;
  });
  const topM = Object.entries(motivoMap).sort(
    (a, b) => b[1].count - a[1].count,
  );
  const fmEl = document.getElementById("funil-motivos");
  if (topM.length) {
    const fmTotQtd = topM.slice(0, 8).reduce((s, [, d]) => s + d.count, 0);
    const fmTotVal = topM.slice(0, 8).reduce((s, [, d]) => s + d.valor, 0);
    fmEl.innerHTML =
      `<table class="dt"><thead><tr><th>#</th><th>Motivo</th><th class="num">Qtd</th><th class="num">Valor R$</th><th class="num">%</th></tr></thead><tbody>` +
      topM
        .slice(0, 8)
        .map(
          ([m, d], i) =>
            `<tr><td>${i + 1}</td><td class="hl">${m}</td><td class="num">${d.count}</td><td class="num">${fmt(d.valor)}</td><td class="num">${fmtPct(perdidos.length > 0 ? (d.count / perdidos.length) * 100 : 0)}</td></tr>`,
        )
        .join("") +
      `<tr style="border-top:2px solid var(--border-soft);background:rgba(255,255,255,.04)"><td></td><td><strong style="color:var(--text)">TOTAL</strong></td><td class="num"><strong>${fmTotQtd}</strong></td><td class="num"><strong>${fmt(fmTotVal)}</strong></td><td class="num"><strong>100%</strong></td></tr>` +
      `</tbody></table>`;
  } else fmEl.innerHTML = noDataHtml("Nenhum motivo de perda registrado");

  // AJUSTE V4 – Tabelas por Estágio em Negócios em Pipeline (Funil & Alertas)
  const fpEl = document.getElementById("funil-pipeline");
  if (pipeline.length) {
    const stageGroups = {};
    pipeline.forEach((r) => {
      const e = r.etapa || "(sem etapa)";
      if (!stageGroups[e]) stageGroups[e] = [];
      stageGroups[e].push(r);
    });
    const stageNames = FUNIL_ORDER.filter((e) => stageGroups[e]).concat(
      Object.keys(stageGroups)
        .filter((e) => !FUNIL_ORDER.includes(e))
        .sort(),
    );
    fpEl.innerHTML = stageNames
      .map((stage) => {
        const deals = stageGroups[stage]
          .slice()
          .sort((a, b) => (b.prop || b.valor) - (a.prop || a.valor));
        const totVal = deals.reduce((s, r) => s + (r.prop || r.valor), 0);
        return (
          `<div style="margin-bottom:20px">
        <div style="font-family:'Poppins';font-size:12px;font-weight:600;color:var(--accent);margin-bottom:6px;padding:6px 10px;background:var(--bg3);border-radius:4px;border-left:3px solid var(--accent)">
          Negócios em Pipeline — Estágio: ${stage} <span style="color:var(--text3);font-weight:400">(${deals.length} negócio${deals.length !== 1 ? "s" : ""})</span>
        </div>
        <table class="dt"><thead><tr><th>Cliente</th><th>Consultor</th><th>Etapa</th><th>Produto</th><th class="num">Proposta</th><th class="num">Dias</th><th>Alerta</th></tr></thead><tbody>` +
          deals
            .map(
              (r) => `<tr>
          <td class="hl">${(r.cliente || "—").substring(0, 28)}</td>
          <td>${(r.consultor || "—").split(" ")[0]}</td>
          <td>${r.etapa || "—"}</td>
          <td><span class="badge bc">${r.produto}</span></td>
          <td class="num">${fmt(r.prop || r.valor)}</td>
          <td class="num">${r.dias || 0}</td>
          <td>${alertaBadge(r.alerta, r.dias)}</td>
        </tr>`,
            )
            .join("") +
          `<tr style="border-top:2px solid var(--border-soft);background:rgba(255,255,255,.04)"><td><strong style="color:var(--text)">TOTAL</strong></td><td></td><td></td><td></td><td class="num"><strong>${fmt(totVal)}</strong></td><td class="num"><strong>${deals.length}</strong></td><td></td></tr>` +
          `</tbody></table></div>`
        );
      })
      .join("");
  } else fpEl.innerHTML = noDataHtml("Nenhum negócio em pipeline no período");
}
function renderSeller() {
  const fd = AppState.filteredData;
  const ganhos = fd.filter((r) => r.status === "ganho");
  const perdidos = fd.filter((r) => r.status === "perdido");
  const from = AppState.filters.dateFrom,
    to = AppState.filters.dateTo;
  const months = monthsInRange(from.substring(0, 7), to.substring(0, 7));
  const numMonths = months.length;
  // AJUSTE V4 – Inclusão de Leonilton Oliveira e Silvio Leal (Seller Performance)
  const metaSellers = Object.keys(METAS_CONSULTOR);
  const allDataSellers = [
    ...new Set(AppState.rawData.map((r) => r.consultor).filter(Boolean)),
  ];
  const extraSellers = allDataSellers
    .filter((s) => !metaSellers.includes(s))
    .sort();
  const sellers = [...metaSellers, ...extraSellers];
  const sideEl = document.getElementById("sp-sidebar-list");
  const mainEl = document.getElementById("sp-main-panel");

  // Fixed KPI cards — Acumulado 2026 + Mês Atual (not affected by filters)
  const fixedEl = document.getElementById("sp-fixed-kpis");
  if (fixedEl) {
    const curMK = `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}`;
    const allRaw = AppState.rawData;
    const ytdG = allRaw.filter(
      (r) =>
        r.status === "ganho" &&
        r.monthKey &&
        r.monthKey.startsWith(String(CURRENT_YEAR)),
    );
    const mesG = allRaw.filter(
      (r) => r.status === "ganho" && r.monthKey === curMK,
    );
    const ytdP = allRaw.filter(
      (r) =>
        r.status === "perdido" &&
        r.monthKey &&
        r.monthKey.startsWith(String(CURRENT_YEAR)),
    );
    const mesP = allRaw.filter(
      (r) => r.status === "perdido" && r.monthKey === curMK,
    );
    const ytdV = ytdG.reduce((s, r) => s + r.valor, 0);
    const mesV = mesG.reduce((s, r) => s + r.valor, 0);
    const ytdMeta = META_TIME_MES * CURRENT_MONTH;
    const mesMeta = META_TIME_MES;
    const ytdAt = ytdMeta > 0 ? (ytdV / ytdMeta) * 100 : 0;
    const mesAt = mesMeta > 0 ? (mesV / mesMeta) * 100 : 0;
    const ytdConv =
      ytdG.length + ytdP.length > 0
        ? (ytdG.length / (ytdG.length + ytdP.length)) * 100
        : 0;
    const mesConv =
      mesG.length + mesP.length > 0
        ? (mesG.length / (mesG.length + mesP.length)) * 100
        : 0;
    fixedEl.innerHTML = `<div style="background:var(--bg2);border:1px solid var(--border-soft);border-radius:var(--radius);padding:10px 14px;margin-bottom:8px">
      <div style="font-family:'Poppins';font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">📌 KPIs FIXOS — Não afetados pelos filtros</div>
      <div class="g2">
        <div>
          <div style="font-family:'Poppins';font-size:11px;color:var(--warn);font-weight:700;margin-bottom:6px">ACUMULADO 2026</div>
          <div class="kpi-row c4" style="gap:8px">
            ${kpiCard("REALIZADO", fmt(ytdV), "2026 YTD", "c", ytdAt)}
            ${kpiCard("META", fmt(ytdMeta), `${CURRENT_MONTH} meses`, "gold")}
            ${kpiCard("ATINGIMENTO", fmtPct(ytdAt), `${ytdG.length} vendas`, "c", ytdAt)}
            ${kpiCard("CONVERSÃO", fmtPct(ytdConv), `${ytdG.length}G / ${ytdG.length + ytdP.length} total`, "g", ytdConv)}
          </div>
        </div>
        <div>
          <div style="font-family:'Poppins';font-size:11px;color:var(--text);font-weight:700;margin-bottom:6px">MÊS ATUAL (${MONTH_NAMES[CURRENT_MONTH - 1]}/${CURRENT_YEAR})</div>
          <div class="kpi-row c4" style="gap:8px">
            ${kpiCard("REALIZADO", fmt(mesV), `${MONTH_NAMES[CURRENT_MONTH - 1]}`, "c", mesAt)}
            ${kpiCard("META", fmt(mesMeta), "Mês", "gold")}
            ${kpiCard("ATINGIMENTO", fmtPct(mesAt), `${mesG.length} vendas`, "c", mesAt)}
            ${kpiCard("CONVERSÃO", fmtPct(mesConv), `${mesG.length}G / ${mesG.length + mesP.length} total`, "g", mesConv)}
          </div>
        </div>
      </div>
    </div>`;
  }

  sideEl.innerHTML = sellers
    .map((s, i) => {
      const sg = ganhos.filter((r) => r.consultor === s);
      const v = sg.reduce((a, r) => a + r.valor, 0);
      const m = (METAS_CONSULTOR[s]?.total || 0) * numMonths;
      const pct = m > 0 ? (v / m) * 100 : 0;
      const col = SELLER_COLORS[i % SELLER_COLORS.length];
      const pid = "sp-panel-" + i;
      return `<div class="sp-card${i === 0 ? " active" : ""}" onclick="selectSeller(this,'${pid}')" style="border-left:3px solid ${col}">
      <div style="font-family:'Poppins';font-size:13px;color:var(--text);font-weight:600">${s.split(" ")[0]}</div>
      <div style="font-size:10px;color:var(--text3)">${s}</div>
      <div style="margin-top:4px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-family:'Poppins';font-size:11px;color:${col}">${fmt(v)}</span>
        ${pctBadge(pct)}
      </div>
    </div>`;
    })
    .join("");

  // Accumulate chart data separately (scripts inside innerHTML don't execute)
  const spChartData = [];

  mainEl.innerHTML = sellers
    .map((s, i) => {
      const col = SELLER_COLORS[i % SELLER_COLORS.length];
      const pid = "sp-panel-" + i;
      const sg = ganhos.filter((r) => r.consultor === s);
      const sp = perdidos.filter((r) => r.consultor === s);
      const v = sg.reduce((a, r) => a + r.valor, 0);
      const m = (METAS_CONSULTOR[s]?.total || 0) * numMonths;
      const pct = m > 0 ? (v / m) * 100 : 0,
        conv =
          sg.length + sp.length > 0
            ? (sg.length / (sg.length + sp.length)) * 100
            : 0;
      const ticket = sg.length > 0 ? v / sg.length : 0,
        falta = Math.max(0, m - v);
      const bizDays = businessDaysLeft();
      const dailyRate = bizDays > 0 ? falta / bizDays : 0;
      const empresa =
        AppState.rawData
          .filter((r) => r.consultor === s && r.empresa)
          .map((r) => r.empresa)[0] || "—";

      const alerts = [];
      if (pct < 40)
        alerts.push({
          cls: "br",
          msg: `🔴 Meta em risco: apenas ${fmtPct(pct)} atingido`,
        });
      else if (pct < 70)
        alerts.push({
          cls: "bo",
          msg: `🟡 Atenção: ${fmtPct(pct)} da meta — ${bizDays} dias úteis restantes`,
        });
      if (conv < 20 && sg.length + sp.length > 0)
        alerts.push({
          cls: "br",
          msg: `📉 Conversão baixa: ${fmtPct(conv)} (meta: 25%+)`,
        });
      if (ticket > 0 && ticket < 2000)
        alerts.push({
          cls: "bo",
          msg: `💰 Ticket médio baixo: ${fmt(ticket)} — focar em LQ`,
        });
      if (alerts.length === 0)
        alerts.push({
          cls: "bg",
          msg: `✅ KPIs dentro do esperado para o período`,
        });

      let plano = "";
      if (pct < 40)
        plano = `Recuperação urgente: ${falta > 0 ? `fechar ${fmt(falta)} em ${bizDays} dias úteis — necessário ${fmt(dailyRate)}/dia útil.` : ""} Priorizar os 3 maiores deals do pipeline.`;
      else if (pct < 70)
        plano = `Acelerar fechamentos: contato diário com leads quentes. Focar em proposta + follow-up em 24h.`;
      else
        plano = `Manter ritmo. Prospectar novas contas LQ para garantir próximo mês.`;

      const allMonths12 = [
        "2026-01",
        "2026-02",
        "2026-03",
        "2026-04",
        "2026-05",
        "2026-06",
        "2026-07",
        "2026-08",
        "2026-09",
        "2026-10",
        "2026-11",
        "2026-12",
      ];
      const sgAll = AppState.rawData.filter(
        (r) => r.status === "ganho" && r.consultor === s,
      );
      const monthVals = allMonths12.map((mk) =>
        sgAll.filter((r) => r.monthKey === mk).reduce((a, r) => a + r.valor, 0),
      );
      const chartId = "chart-sp-" + i;
      const chartLabels = allMonths12.map((mk) => {
        const [, mo] = mk.split("-");
        return MONTH_NAMES[parseInt(mo) - 1].substring(0, 3);
      });
      // Store chart data for post-innerHTML initialization
      spChartData.push({ chartId, col, monthVals, chartLabels });

      // === DUAL-VIEW: Período filtrado + Mês Atual ===
      const curMK = `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}`;
      const spAll = AppState.rawData.filter(
        (r) => r.status === "perdido" && r.consultor === s,
      );
      const sgAno = sg;
      const spAno = sp;
      const vAno = sgAno.reduce((a, r) => a + r.valor, 0);
      const mAno = METAS_CONSULTOR[s]
        ? METAS_CONSULTOR[s].total * numMonths
        : 0;
      const pctAno = mAno > 0 ? (vAno / mAno) * 100 : 0;
      const convAno =
        sgAno.length + spAno.length > 0
          ? (sgAno.length / (sgAno.length + spAno.length)) * 100
          : 0;
      const sgCurMes = sgAll.filter((r) => r.monthKey === curMK);
      const spCurMes = spAll.filter((r) => r.monthKey === curMK);
      const vMes = sgCurMes.reduce((a, r) => a + r.valor, 0);
      const mMes = METAS_CONSULTOR[s] ? METAS_CONSULTOR[s].total : 0;
      const pctMes = mMes > 0 ? (vMes / mMes) * 100 : 0;
      const convMes =
        sgCurMes.length + spCurMes.length > 0
          ? (sgCurMes.length / (sgCurMes.length + spCurMes.length)) * 100
          : 0;
      const ticketMes = sgCurMes.length > 0 ? vMes / sgCurMes.length : 0;
      const faltaMes = Math.max(0, mMes - vMes);

      return `<div class="sp-panel${i === 0 ? " active" : ""}" id="${pid}">
      <div id="export-card-${i}" style="background:#060A16;border-radius:12px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
          <div>
            <div style="font-family:'Poppins';font-size:26px;letter-spacing:1px;color:${col}">${s}</div>
            <div style="font-family:'Poppins';font-size:11px;color:var(--text3)">${empresa}</div>
          </div>
          <button class="export-btn" onclick="exportSeller(${i})">📱 Exportar p/ WhatsApp</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
          <div style="background:var(--bg3);border-radius:10px;padding:10px;border-top:2px solid var(--accent)">
            <div style="font-family:'Poppins';font-size:9px;color:var(--text3);margin-bottom:8px;letter-spacing:1px">📊 PERÍODO FILTRADO</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
              ${[
                ["REALIZADO", fmt(vAno), col],
                ["META", fmt(mAno), "var(--warn)"],
                ["ATINGIMENTO", fmtPct(pctAno), gaugeColor(pctAno)],
                ["CONVERSÃO", fmtPct(convAno), "var(--text)"],
              ]
                .map(
                  ([l, val, c]) => `
              <div style="background:var(--bg2);border-radius:6px;padding:7px;text-align:center">
                <div style="font-family:'Poppins';font-size:8px;color:var(--text3)">${l}</div>
                <div style="font-family:'Poppins';font-size:14px;color:${c}">${val}</div>
              </div>`,
                )
                .join("")}
            </div>
          </div>
          <div style="background:var(--bg3);border-radius:10px;padding:10px;border-top:2px solid ${col}">
            <div style="font-family:'Poppins';font-size:9px;color:var(--text3);margin-bottom:8px;letter-spacing:1px">🗓 ${MONTH_NAMES[CURRENT_MONTH - 1].toUpperCase()}/${CURRENT_YEAR}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
              ${[
                ["REALIZADO", fmt(vMes), col],
                ["META", fmt(mMes), "var(--warn)"],
                ["ATINGIMENTO", fmtPct(pctMes), gaugeColor(pctMes)],
                ["CONVERSÃO", fmtPct(convMes), "var(--text)"],
              ]
                .map(
                  ([l, val, c]) => `
              <div style="background:var(--bg2);border-radius:6px;padding:7px;text-align:center">
                <div style="font-family:'Poppins';font-size:8px;color:var(--text3)">${l}</div>
                <div style="font-family:'Poppins';font-size:14px;color:${c}">${val}</div>
              </div>`,
                )
                .join("")}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:12px;align-items:center;margin-top:10px">
          ${buildGaugeSVG(pctMes, `Meta: ${fmt(mMes)}`, "130px")}
          <div style="flex:1">
            <div style="font-family:'Poppins';font-size:10px;color:var(--text3)">TICKET MÉDIO</div>
            <div style="font-family:'Poppins';font-size:18px;color:var(--text)">${fmt(ticketMes)}</div>
            <div style="font-family:'Poppins';font-size:10px;color:var(--text3);margin-top:4px">GANHOS / PERDIDOS</div>
            <div style="font-family:'Poppins';font-size:16px;color:var(--text)">${sgCurMes.length} / ${spCurMes.length}</div>
            <div style="font-family:'Poppins';font-size:10px;color:var(--text3);margin-top:4px">FALTA / DIAS ÚTEIS</div>
            <div style="font-family:'Poppins';font-size:14px;color:${faltaMes > 0 ? "var(--red2)" : "var(--green3)"}">
              ${faltaMes > 0 ? fmt(faltaMes) : "✅ Meta batida"} ${bizDays > 0 ? "/ " + bizDays + "du" : ""}
            </div>
          </div>
        </div>
        <div style="margin-top:10px">${alerts.map((a) => `<div class="alert-row ${a.cls === "br" ? "red" : a.cls === "bo" ? "gold" : "green"}" style="margin-bottom:4px;font-size:11px">${a.msg}</div>`).join("")}</div>
      </div>
            <div class="card mb12" style="border-left:3px solid ${col}">
        <div class="card-title">Evolução de Vendas — 2026 (não afetado por filtros)</div>
        <div style="height:160px"><canvas id="${chartId}"></canvas></div>
      </div>
      <div class="card mb12">
        <div class="card-title">🎯 Perfil de Competências</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${[
            [
              "Volume de Vendas",
              Math.min(100, pct).toFixed(0),
              gaugeColor(pct),
            ],
            [
              "Taxa de Conversão",
              Math.min(100, conv * 2).toFixed(0),
              gaugeColor(conv * 2),
            ],
            [
              "Ticket Médio",
              Math.min(100, ticket > 0 ? (ticket / 10000) * 100 : 0).toFixed(0),
              gaugeColor(ticket > 0 ? (ticket / 10000) * 100 : 0),
            ],
          ]
            .map(
              ([
                nome,
                val,
                cor,
              ]) => `<div style="text-align:center;background:var(--bg3);border-radius:8px;padding:8px">
            <div style="font-family:'Poppins';font-size:9px;color:var(--text3);text-transform:uppercase;margin-bottom:4px">${nome}</div>
            <div style="font-family:'Poppins';font-size:22px;color:${cor}">${val}%</div>
            <div style="height:4px;background:var(--bg4);border-radius:2px;margin-top:4px"><div style="height:100%;width:${Math.min(100, +val)}%;background:${cor};border-radius:2px"></div></div>
          </div>`,
            )
            .join("")}
        </div>
      </div>
      <div class="card mb12">
        <div class="card-title">💡 Alertas &amp; Insights</div>
        ${alerts.map((a) => `<div class="alert-row ${a.cls === "br" ? "red" : a.cls === "bo" ? "gold" : "green"}" style="margin-bottom:4px;font-size:11px">${a.msg}</div>`).join("")}
      </div>
      <div class="card mb12">
        <div class="card-title">📋 Top Leads em Aberto</div>
        ${(() => {
          const pipe = AppState.rawData
            .filter((r) => r.status === "pipeline" && r.consultor === s)
            .sort((a, b) => (b.prop || b.valor) - (a.prop || a.valor))
            .slice(0, 5);
          if (!pipe.length)
            return `<div style="color:var(--text3);font-size:11px;padding:8px">Nenhum lead em pipeline</div>`;
          const pipeTotProp = pipe.reduce((s, r) => s + (r.prop || r.valor), 0);
          return (
            `<table class="dt"><thead><tr><th>Cliente</th><th>Etapa</th><th>Produto</th><th class="num">Proposta</th><th class="num">Dias</th></tr></thead><tbody>` +
            pipe
              .map(
                (r) =>
                  `<tr><td class="hl">${(r.cliente || "—").substring(0, 24)}</td><td>${r.etapa || "—"}</td><td><span class="badge bc">${r.produto}</span></td><td class="num">${fmt(r.prop || r.valor)}</td><td class="num">${r.dias || 0}</td></tr>`,
              )
              .join("") +
            `<tr style="border-top:2px solid var(--border-soft);background:rgba(255,255,255,.04)"><td><strong style="color:var(--text)">TOTAL</strong></td><td></td><td></td><td class="num"><strong>${fmt(pipeTotProp)}</strong></td><td></td></tr>` +
            `</tbody></table>`
          );
        })()}
      </div>
      <div style="background:var(--bg3);border-left:3px solid var(--warn);padding:10px 14px;margin-bottom:12px;border-radius:0 8px 8px 0">
        <div style="font-family:'Poppins';font-size:11px;color:var(--warn);font-weight:700;margin-bottom:4px">📌 PLANO DE AÇÃO</div>
        <div style="font-size:11px;color:var(--text2);margin-top:4px">${plano}</div>
        ${falta > 0 ? `<div style="font-family:'Poppins';font-size:11px;color:var(--warn);margin-top:4px">Meta diária: ${fmt(dailyRate)}/dia útil</div>` : ""}
      </div>
      <div class="card">
        <div class="card-title">Meta por Produto — Período</div>
        ${["RSS", "Gerenciamento", "Consultoria"]
          .map((p) => {
            const pv = sg
              .filter((r) => r.produto === p)
              .reduce((a, r) => a + r.valor, 0);
            const pm = (METAS_CONSULTOR[s]?.[p] || 0) * numMonths;
            const pp = pm > 0 ? (pv / pm) * 100 : 0;
            return `<div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-family:'Poppins';font-size:11px;color:var(--text2)">
              <span>${p}</span><span style="color:${gaugeColor(pp)}">${fmt(pv)} / ${fmt(pm)} · ${fmtPct(pp)}</span>
            </div>
            <div class="mini-bar-bg"><div class="mini-bar-fill" style="width:${Math.min(100, pp).toFixed(1)}%;background:${gaugeColor(pp)}"></div></div>
          </div>`;
          })
          .join("")}
      </div>
    </div>`;
    })
    .join("");

  // Initialize Seller charts AFTER innerHTML is set (scripts in innerHTML don't execute)
  spChartData.forEach(({ chartId, col, monthVals, chartLabels }) => {
    dc(chartId);
    const ctx = document.getElementById(chartId);
    if (!ctx) return;
    new Chart(ctx, {
      type: "line",
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: "Vendas",
            data: monthVals,
            borderColor: col,
            backgroundColor: col + "22",
            tension: 0.3,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: col,
          },
        ],
      },
      options: {
        ...chartDefaults(),
        plugins: {
          ...chartDefaults().plugins,
          tooltip: { callbacks: { label: (c) => fmt(c.raw) } },
        },
      },
    });
  });
}

function selectSeller(el, pid) {
  document
    .querySelectorAll(".sp-card")
    .forEach((c) => c.classList.remove("active"));
  document
    .querySelectorAll(".sp-panel")
    .forEach((p) => p.classList.remove("active"));
  el.classList.add("active");
  const panel = document.getElementById(pid);
  if (panel) panel.classList.add("active");
}

function renderGestor() {
  // Prioridades Imediatas — Esta Semana (current month, unfiltered)
  const priorEl = document.getElementById("gestor-prioridades");
  const alavEl = document.getElementById("gestor-alavancas");
  if (priorEl && alavEl) {
    const curMK = `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}`;
    const allRaw = AppState.rawData;
    const mesG = allRaw.filter(
      (r) => r.status === "ganho" && r.monthKey === curMK,
    );
    const mesP = allRaw.filter(
      (r) => r.status === "perdido" && r.monthKey === curMK,
    );
    const mesPipe = allRaw.filter((r) => r.status === "pipeline");
    const mesV = mesG.reduce((s, r) => s + r.valor, 0);
    const mesAt = META_TIME_MES > 0 ? (mesV / META_TIME_MES) * 100 : 0;
    const bizDays = businessDaysLeft();

    // Prioridades: sellers at risk this week
    const priorItems = Object.keys(METAS_CONSULTOR)
      .map((s) => {
        const sg = mesG.filter((r) => r.consultor === s);
        const v = sg.reduce((a, r) => a + r.valor, 0);
        const m = METAS_CONSULTOR[s].total;
        const pct = m > 0 ? (v / m) * 100 : 0;
        const pipe = mesPipe.filter((r) => r.consultor === s);
        return { s, pct, v, m, falta: Math.max(0, m - v), pipe: pipe.length };
      })
      .filter((r) => r.pct < 70)
      .sort((a, b) => b.falta - a.falta);

    priorEl.innerHTML = priorItems.length
      ? priorItems
          .map(
            (r) => `
      <div class="alert-row ${r.pct < 40 ? "red" : "gold"}" style="margin-bottom:6px">
        <strong>${r.s.split(" ")[0]}</strong> — ${fmtPct(r.pct)} da meta mensal · Falta: ${fmt(r.falta)} · Pipeline: ${r.pipe} deals
        ${r.pct < 40 ? `<br><em style="font-size:10px;color:var(--text3)">⚡ Ação urgente: agendar reunião de revisão esta semana</em>` : `<br><em style="font-size:10px;color:var(--text3)">Focar nos ${r.pipe} deals em pipeline para fechamento</em>`}
      </div>`,
          )
          .join("")
      : `<div class="alert-row green">✅ Todos os consultores acima de 70% da meta mensal</div>`;

    // Alavancas de Crescimento
    const totalPipe = mesPipe.reduce((s, r) => s + (r.prop || r.valor), 0);
    const topOrigens = Object.entries(
      mesG.reduce((acc, r) => {
        acc[r.origem || "Não inf"] =
          (acc[r.origem || "Não inf"] || 0) + r.valor;
        return acc;
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const fcPipe = mesPipe.filter((r) => {
      const e = (r.etapa || "").toLowerCase();
      return e.includes("forcast") || e.includes("forecast");
    });
    const fcVal2 = fcPipe.reduce((s, r) => s + (r.prop || r.valor), 0);

    // Build per-seller pipeline analysis
    const sellersPipe = Object.keys(METAS_CONSULTOR)
      .map((sl) => {
        const slPipe = mesPipe.filter((r) => r.consultor === sl);
        const slFc = slPipe.filter((r) => {
          const e = (r.etapa || "").toLowerCase();
          return e.includes("forcast") || e.includes("forecast");
        });
        const slG = mesG.filter((r) => r.consultor === sl);
        const slV = slG.reduce((s, r) => s + r.valor, 0);
        const slM = METAS_CONSULTOR[sl].total;
        const slPct = slM > 0 ? (slV / slM) * 100 : 0;
        return {
          sl,
          pct: slPct,
          falta: Math.max(0, slM - slV),
          fcVal: slFc.reduce((s, r) => s + (r.prop || r.valor), 0),
          pipeN: slPipe.length,
        };
      })
      .sort((a, b) => a.pct - b.pct);

    alavEl.innerHTML = `
      <div class="alert-row green" style="margin-bottom:6px">💰 Pipeline total: <strong>${fmt(totalPipe)}</strong> em ${mesPipe.length} deals — potencial de aceleração</div>
      <div class="alert-row ${fcVal2 > 0 ? "bc" : "red"}" style="margin-bottom:6px">🎯 Forecast pronto para fechar: <strong>${fmt(fcVal2)}</strong> (${fcPipe.length} deals)</div>
      ${topOrigens.length ? `<div class="alert-row green" style="margin-bottom:6px">📊 Top origens do mês: ${topOrigens.map(([o, v]) => `<strong>${o}</strong> ${fmt(v)}`).join(" · ")}</div>` : ""}
      <div class="alert-row ${mesAt >= 70 ? "green" : "gold"}" style="margin-bottom:6px">📈 Time no mês: <strong>${fmtPct(mesAt)}</strong> da meta · Restam ${bizDays} dias úteis</div>
      <div style="font-family:'Poppins';font-size:10px;color:var(--text3);margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">📋 Plano de Ação — Prioridade por Consultor</div>
      ${sellersPipe
        .slice(0, 3)
        .map((r, i) => {
          let acao = "";
          if (r.pct < 40)
            acao = `Ação imediata: reunião 1:1 hoje. Ligar para top ${r.pipeN} leads do pipeline.`;
          else if (r.pct < 70)
            acao = `Focar nos ${r.fcVal > 0 ? "deals em Forecast: " + fmt(r.fcVal) : r.pipeN + " deals ativos"}. Follow-up em 24h.`;
          else acao = `No ritmo. Manter cadência e prospectar novas contas.`;
          return `<div class="alert-row ${r.pct < 40 ? "red" : r.pct < 70 ? "gold" : "green"}" style="margin-bottom:4px;font-size:11px">
          <strong>${r.sl.split(" ")[0]}</strong>: ${fmtPct(r.pct)} meta · Falta ${fmt(r.falta)} · ${acao}
        </div>`;
        })
        .join("")}`;
  }

  // [A5.6] Priority alerts for ALL sellers
  const paEl = document.getElementById("gestor-priority-alerts");
  const from = AppState.filters.dateFrom,
    to = AppState.filters.dateTo;
  const months = monthsInRange(from.substring(0, 7), to.substring(0, 7));
  const numMonths = months.length;
  const allG = AppState.filteredData.filter((r) => r.status === "ganho");
  const allP = AppState.filteredData.filter((r) => r.status === "perdido");
  const endOfMonth = new Date(CURRENT_YEAR, CURRENT_MONTH, 0);
  const daysLeft = Math.max(
    0,
    Math.ceil((endOfMonth - TODAY) / (1000 * 60 * 60 * 24)),
  );

  const priority = Object.keys(METAS_CONSULTOR)
    .map((s) => {
      const sg = allG.filter((r) => r.consultor === s),
        sp = allP.filter((r) => r.consultor === s);
      const v = sg.reduce((a, r) => a + r.valor, 0),
        m = METAS_CONSULTOR[s].total * numMonths;
      const pct = m > 0 ? (v / m) * 100 : 0,
        falta = Math.max(0, m - v);
      const conv =
        sg.length + sp.length > 0
          ? (sg.length / (sg.length + sp.length)) * 100
          : 0;
      const score =
        (100 - pct) * 2 + (conv < 20 ? 50 : 0) + (falta / metaImpact(s)) * 100;
      return { s, pct, falta, conv, score, v, m };
    })
    .sort((a, b) => b.score - a.score);

  paEl.innerHTML =
    `<div style="font-family:'Poppins';font-size:11px;color:var(--text3);margin-bottom:8px">Ordenado por impacto potencial no resultado do time (${daysLeft} dias restantes no mês)</div>` +
    priority
      .map((r, i) => {
        const cls = r.pct < 40 ? "red" : r.pct < 70 ? "gold" : "green";
        return `<div class="alert-row ${cls}">
        <strong>#${i + 1} ${r.s}</strong> — ${fmtPct(r.pct)} atingido · Gap: ${fmt(r.falta)} · Conversão: ${fmtPct(r.conv)}
        ${r.pct < 70 ? ` — <em style="color:var(--text3)">Ação: focar em ${r.falta > 20000 ? "fechamento de grandes deals" : "aumento de volume de propostas"}</em>` : ""}
      </div>`;
      })
      .join("");

  // Update gestor seller dropdown
  populateGestorSelect();
  renderGestorPanel();
}

function metaImpact(s) {
  return METAS_CONSULTOR[s] ? METAS_CONSULTOR[s].total : 1;
}

function renderGestorPanel() {
  const selName = document.getElementById("gestor-seller-select")?.value;
  const execEl = document.getElementById("gestor-exec-summary");
  const kpiEl = document.getElementById("gestor-kpi-analysis");
  const insEl = document.getElementById("gestor-insights");
  const pdcaEl = document.getElementById("gestor-pdca");

  if (!selName) {
    [execEl, kpiEl, insEl, pdcaEl].forEach((el) => {
      if (el)
        el.innerHTML =
          "<div style=\"color:var(--text3);font-family:'Poppins';padding:12px\">Selecione um consultor acima para ver a análise individual.</div>";
    });
    return;
  }

  const fd = AppState.filteredData;
  const from = AppState.filters.dateFrom,
    to = AppState.filters.dateTo;
  const months = monthsInRange(from.substring(0, 7), to.substring(0, 7));
  const numMonths = months.length;
  const sg = fd.filter((r) => r.status === "ganho" && r.consultor === selName);
  const sp = fd.filter(
    (r) => r.status === "perdido" && r.consultor === selName,
  );
  const pipe = fd.filter(
    (r) => r.status === "pipeline" && r.consultor === selName,
  );
  const all = fd.filter((r) => r.consultor === selName);
  const v = sg.reduce((a, r) => a + r.valor, 0);
  const m = METAS_CONSULTOR[selName].total * numMonths;
  const pct = m > 0 ? (v / m) * 100 : 0,
    falta = Math.max(0, m - v);
  const conv =
    sg.length + sp.length > 0 ? (sg.length / (sg.length + sp.length)) * 100 : 0;
  const ticket = sg.length > 0 ? v / sg.length : 0;
  const diasList = all.filter((r) => r.dias > 0).map((r) => r.dias);
  const diasMedio =
    diasList.length > 0
      ? diasList.reduce((a, b) => a + b, 0) / diasList.length
      : 0;
  const teamAvgTicket =
    fd.filter((r) => r.status === "ganho").length > 0
      ? fd
          .filter((r) => r.status === "ganho")
          .reduce((a, r) => a + r.valor, 0) /
        fd.filter((r) => r.status === "ganho").length
      : 1;
  const endOfMonth = new Date(CURRENT_YEAR, CURRENT_MONTH, 0);
  const daysLeft = Math.max(
    0,
    Math.ceil((endOfMonth - TODAY) / (1000 * 60 * 60 * 24)),
  );

  // [A5.2] Executive summary
  const fortes = [],
    criticos = [];
  if (pct >= 70) fortes.push(`Meta em dia: ${fmtPct(pct)} atingido`);
  if (conv >= 25) fortes.push(`Conversão sólida: ${fmtPct(conv)}`);
  if (ticket >= teamAvgTicket)
    fortes.push(`Ticket acima da média do time: ${fmt(ticket)}`);
  if (pct < 50)
    criticos.push(`Meta crítica: apenas ${fmtPct(pct)} — falta ${fmt(falta)}`);
  else if (pct < 70)
    criticos.push(`Meta em risco: ${fmtPct(pct)} — requer aceleração`);
  if (conv < 20 && sg.length + sp.length > 3)
    criticos.push(`Conversão baixa: ${fmtPct(conv)} (benchmark: 25%+)`);
  if (ticket < teamAvgTicket * 0.7 && sg.length > 0)
    criticos.push(
      `Ticket abaixo da média: ${fmt(ticket)} vs ${fmt(teamAvgTicket)} time`,
    );
  if (diasMedio > 30)
    criticos.push(
      `Ciclo de venda longo: média de ${diasMedio.toFixed(0)} dias no pipeline`,
    );

  // Gestor dual-view: período filtrado
  const curMKGestor = `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}`;
  const sgYTDGestor = sg;
  const spYTDGestor = sp;
  const vYTDGestor = sgYTDGestor.reduce((a, r) => a + r.valor, 0);
  const mYTDGestor = METAS_CONSULTOR[selName].total * numMonths;
  const pctYTDGestor = mYTDGestor > 0 ? (vYTDGestor / mYTDGestor) * 100 : 0;
  const convYTDGestor =
    sgYTDGestor.length + spYTDGestor.length > 0
      ? (sgYTDGestor.length / (sgYTDGestor.length + spYTDGestor.length)) * 100
      : 0;
  const sgMesGestor = sg;
  const spMesGestor = sp;
  const vMesGestor = sgMesGestor.reduce((a, r) => a + r.valor, 0);
  const mMesGestor = METAS_CONSULTOR[selName].total;
  const pctMesGestor = mMesGestor > 0 ? (vMesGestor / mMesGestor) * 100 : 0;
  const convMesGestor =
    sgMesGestor.length + spMesGestor.length > 0
      ? (sgMesGestor.length / (sgMesGestor.length + spMesGestor.length)) * 100
      : 0;

  execEl.innerHTML = `<div class="card">
    <!-- Dual view: Annual 2026 + Current Month -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div style="padding:10px;background:rgba(255,215,158,.07);border-radius:8px;border-left:3px solid var(--warn)">
        <div style="font-family:'Poppins';font-size:9px;color:var(--warn);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">📊 Período Filtrado</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
          <div style="background:var(--bg3);border-radius:6px;padding:8px;text-align:center">
            <div style="font-family:'Poppins';font-size:9px;color:var(--text3)">REALIZADO</div>
            <div style="font-family:'Poppins';font-size:18px;color:${gaugeColor(pctYTDGestor)}">${fmt(vYTDGestor)}</div>
          </div>
          <div style="background:var(--bg3);border-radius:6px;padding:8px;text-align:center">
            <div style="font-family:'Poppins';font-size:9px;color:var(--text3)">META</div>
            <div style="font-family:'Poppins';font-size:18px;color:var(--warn)">${fmt(mYTDGestor)}</div>
          </div>
          <div style="background:var(--bg3);border-radius:6px;padding:8px;text-align:center">
            <div style="font-family:'Poppins';font-size:9px;color:var(--text3)">ATING.</div>
            <div style="font-family:'Poppins';font-size:18px;color:${gaugeColor(pctYTDGestor)}">${fmtPct(pctYTDGestor)}</div>
          </div>
        </div>
      </div>
      <div style="padding:10px;background:rgba(188,214,255,.07);border-radius:8px;border-left:3px solid var(--info)">
        <div style="font-family:'Poppins';font-size:9px;color:var(--info);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">📅 Mês Atual — ${MONTH_NAMES[CURRENT_MONTH - 1]}/${CURRENT_YEAR}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
          <div style="background:var(--bg3);border-radius:6px;padding:8px;text-align:center">
            <div style="font-family:'Poppins';font-size:9px;color:var(--text3)">REALIZADO</div>
            <div style="font-family:'Poppins';font-size:18px;color:${gaugeColor(pctMesGestor)}">${fmt(vMesGestor)}</div>
          </div>
          <div style="background:var(--bg3);border-radius:6px;padding:8px;text-align:center">
            <div style="font-family:'Poppins';font-size:9px;color:var(--text3)">META</div>
            <div style="font-family:'Poppins';font-size:18px;color:var(--warn)">${fmt(mMesGestor)}</div>
          </div>
          <div style="background:var(--bg3);border-radius:6px;padding:8px;text-align:center">
            <div style="font-family:'Poppins';font-size:9px;color:var(--text3)">ATING.</div>
            <div style="font-family:'Poppins';font-size:18px;color:${gaugeColor(pctMesGestor)}">${fmtPct(pctMesGestor)}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="g2">
      <div>
        <div style="font-family:'Poppins';font-size:11px;color:var(--green3);margin-bottom:4px">✅ PONTOS FORTES</div>
        ${fortes.length ? fortes.map((f) => `<div class="alert-row green" style="margin-bottom:4px;font-size:11px">${f}</div>`).join("") : '<div style="font-size:11px;color:var(--text3);padding:4px">Nenhum ponto forte identificado no período</div>'}
      </div>
      <div>
        <div style="font-family:'Poppins';font-size:11px;color:var(--red2);margin-bottom:4px">⚠️ PONTOS CRÍTICOS</div>
        ${criticos.length ? criticos.map((c) => `<div class="alert-row red" style="margin-bottom:4px;font-size:11px">${c}</div>`).join("") : '<div style="font-size:11px;color:var(--text3);padding:4px">Nenhum ponto crítico</div>'}
      </div>
    </div>
  </div>`;

  // [A5.3] KPI Analysis — dual view annual 2026 + current month
  const kpis = [
    {
      nome: "Receita Total 2026",
      atual: fmt(vYTDGestor),
      meta: fmt(mYTDGestor),
      devAbs: fmt(Math.abs(vYTDGestor - mYTDGestor)),
      devPct: fmtPct(
        mYTDGestor > 0
          ? (Math.abs(vYTDGestor - mYTDGestor) / mYTDGestor) * 100
          : 0,
      ),
      tendencia: pctYTDGestor >= 70 ? "▲" : "▼",
      comentario: `Anual 2026: ${fmtPct(pctYTDGestor)} atingido. Mês atual: ${fmtPct(pctMesGestor)} atingido.`,
    },
    {
      nome: "Receita Mês Atual",
      atual: fmt(vMesGestor),
      meta: fmt(mMesGestor),
      devAbs: fmt(Math.abs(vMesGestor - mMesGestor)),
      devPct: fmtPct(
        mMesGestor > 0
          ? (Math.abs(vMesGestor - mMesGestor) / mMesGestor) * 100
          : 0,
      ),
      tendencia: pctMesGestor >= 70 ? "▲" : "▼",
      comentario:
        pctMesGestor < 50
          ? "Meta mensal crítica. Dobrar fechamentos restantes do mês."
          : pctMesGestor < 70
            ? "Ritmo mensal insuficiente. Focar nos deals maiores do pipeline."
            : "Ritmo mensal adequado. Manter consistência.",
    },
    {
      nome: "Taxa de Conversão",
      atual: fmtPct(conv),
      meta: "25%",
      devAbs: fmtPct(Math.abs(conv - 25)),
      devPct: fmtPct((Math.abs(conv - 25) / 25) * 100),
      tendencia: conv >= 25 ? "▲" : "▼",
      comentario:
        conv < 15
          ? "Conversão crítica. Revisar qualificação de leads e script de fechamento."
          : conv < 25
            ? "Abaixo do benchmark. Implementar follow-up estruturado em 24h."
            : "Conversão saudável.",
    },
    {
      nome: "Ticket Médio",
      atual: fmt(ticket),
      meta: fmt(teamAvgTicket),
      devAbs: fmt(Math.abs(ticket - teamAvgTicket)),
      devPct: fmtPct(
        teamAvgTicket > 0
          ? (Math.abs(ticket - teamAvgTicket) / teamAvgTicket) * 100
          : 0,
      ),
      tendencia: ticket >= teamAvgTicket ? "▲" : "▼",
      comentario:
        ticket < teamAvgTicket * 0.7
          ? "Ticket baixo. Priorizar deals LQ e evitar SQ de baixo valor."
          : "Ticket dentro da faixa esperada.",
    },
    {
      nome: "Ciclo de Venda (dias)",
      atual: diasMedio.toFixed(0) + "d",
      meta: "30d",
      devAbs: Math.abs(diasMedio - 30).toFixed(0) + "d",
      devPct: fmtPct((Math.abs(diasMedio - 30) / 30) * 100),
      tendencia: diasMedio <= 30 ? "▲" : "▼",
      comentario:
        diasMedio > 45
          ? "Ciclo muito longo. Identificar gargalos de negociação e definir prazo máximo por etapa."
          : diasMedio > 30
            ? "Ciclo acima do ideal. Pressionar fechamentos estagnados."
            : "Ciclo saudável.",
    },
    {
      nome: "Leads Trabalhados",
      atual: fmtN(all.length),
      meta: "—",
      devAbs: "—",
      devPct: "—",
      tendencia: "→",
      comentario: `${sg.length} ganhos, ${sp.length} perdidos, ${pipe.length} em pipeline.`,
    },
  ];
  kpiEl.innerHTML =
    `<table class="dt"><thead><tr><th>KPI</th><th class="num">Atual</th><th class="num">Meta/Bench.</th><th class="num">Desvio</th><th>Tend.</th><th>Comentário</th></tr></thead><tbody>` +
    kpis
      .map(
        (k) => `<tr>
      <td class="hl">${k.nome}</td>
      <td class="num">${k.atual}</td>
      <td class="num" style="color:var(--text3)">${k.meta}</td>
      <td class="num" style="color:${k.tendencia === "▲" ? "var(--green3)" : "var(--red2)"}">${k.devAbs}</td>
      <td style="color:${k.tendencia === "▲" ? "var(--green3)" : k.tendencia === "▼" ? "var(--red2)" : "var(--text3)"};font-size:14px">${k.tendencia}</td>
      <td style="font-size:10px;color:var(--text2);line-height:1.4;max-width:200px">${k.comentario}</td>
    </tr>`,
      )
      .join("") +
    `</tbody></table>`;

  // [A5.4] Insights estratégicos
  const insights = [];
  // Annual context
  if (pctYTDGestor < 80) {
    insights.push({
      titulo: `📊 Desempenho Anual 2026: ${fmtPct(pctYTDGestor)} da meta`,
      texto: `Acumulado 2026: ${fmt(vYTDGestor)} realizado de ${fmt(mYTDGestor)} meta (${CURRENT_MONTH} meses). ${pctYTDGestor >= 70 ? "Ritmo anual adequado, mas requer atenção no mês atual." : "Ritmo anual abaixo do esperado. Necessário acelerar volume nos próximos meses para fechar o ano no verde."}`,
    });
  }
  if (pct < 50) {
    const addConv = ((25 - conv) / 100) * all.length * ticket;
    insights.push({
      titulo: `🎯 Prioridade #1: Recuperar meta de receita`,
      texto: `Faltam ${fmt(falta)} para atingir a meta do período (filtrado). Com ${daysLeft} dias restantes, é necessário fechar ${fmt(daysLeft > 0 ? falta / daysLeft : falta)}/dia. Foco imediato nos ${pipe.length} deals de pipeline. Aumentar conversão de ${fmtPct(conv)} para 25% representaria +${fmt(addConv)} adicionais.`,
    });
  }
  if (conv < 20 && sg.length + sp.length > 2) {
    insights.push({
      titulo: `📊 Prioridade ${insights.length + 1}: Aumentar Taxa de Conversão`,
      texto: `Taxa atual de ${fmtPct(conv)} está abaixo do benchmark (25%). Cada ponto percentual de melhoria representa aprox. ${fmt(ticket)} adicional de receita. Ação imediata: revisar etapas com maior churn no funil e implementar follow-up estruturado.`,
    });
  }
  if (ticket < teamAvgTicket * 0.8 && sg.length > 1) {
    insights.push({
      titulo: `💰 Oportunidade: Elevar Ticket Médio`,
      texto: `Ticket de ${fmt(ticket)} está ${fmtPct((1 - ticket / teamAvgTicket) * 100)} abaixo da média do time (${fmt(teamAvgTicket)}). Elevar para a média representaria +${fmt((teamAvgTicket - ticket) * sg.length)} no período. Focar em contas LQ e upsell de clientes existentes.`,
    });
  }
  if (insights.length === 0)
    insights.push({
      titulo: "✅ Performance dentro dos parâmetros",
      texto: `${selName} está atingindo os benchmarks principais. Foco em manutenção do ritmo e prospecção de novas contas para garantir o próximo mês.`,
    });

  insEl.innerHTML = insights
    .map(
      (ins) => `<div class="insight-item">
    <div style="font-family:'Poppins';font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">${ins.titulo}</div>
    <div style="font-size:11px;color:var(--text2);line-height:1.5">${ins.texto}</div>
  </div>`,
    )
    .join("");

  // [A5.5] PDCA
  const pdcas = [];
  if (pct < 70)
    pdcas.push({
      kpi: "Meta de Receita",
      col: "var(--bad)",
      P: `Objetivo: fechar ${fmt(falta)} em ${daysLeft} dias. Ações: (1) listar top 5 deals do pipeline, (2) definir próximo passo para cada, (3) agendar 3 reuniões de fechamento por semana.`,
      D: `Execução diária: contato com todos os leads quentes antes das 11h. Enviar proposta revisada em até 2h após reunião. Registrar tudo no CRM no mesmo dia.`,
      C: `Verificação: toda segunda-feira, comparar realizado acumulado vs meta proporcional. Atualizar forecast semanal com gestor.`,
      A: `Se após 2 semanas sem avanço: (1) revisar pitch com gestor, (2) reclassificar leads frios, (3) intensificar prospecção de novas contas.`,
    });
  if (conv < 20 && sg.length + sp.length > 2)
    pdcas.push({
      kpi: "Taxa de Conversão",
      col: "var(--warn)",
      P: `Objetivo: elevar conversão de ${fmtPct(conv)} para 25%. Ações: (1) mapear objeções mais comuns, (2) criar script de resposta, (3) definir SLA de follow-up pós-reunião.`,
      D: `Todo contato deve ter próximo passo definido. Follow-up obrigatório em 24h. Usar template de proposta atualizado com casos de sucesso.`,
      C: `Acompanhar taxa de conversão semanalmente (# fechados / # reuniões realizadas).`,
      A: `Se conversão não subir em 3 semanas: role-play de fechamento com gestor, análise de gravações de reuniões.`,
    });
  if (pdcas.length === 0)
    pdcas.push({
      kpi: "Crescimento e Consistência",
      col: "var(--ok)",
      P: `Objetivo: manter atingimento ≥70% mensalmente. Prospectar 5 novas contas LQ por mês.`,
      D: `Dedicar 1h/dia à prospecção ativa. Participar de eventos do setor trimestralmente.`,
      C: `Review mensal de pipeline: garantir ≥15 deals ativos.`,
      A: `Se volume de leads cair, intensificar prospecção e pedir indicações de clientes ativos.`,
    });

  pdcaEl.innerHTML = pdcas
    .map(
      (p, i) => `<div class="pdca-card">
    <div class="pdca-hdr" onclick="togglePDCA(${i})" style="border-left:3px solid ${p.col}">
      <span style="color:${p.col}">📋 ${p.kpi}</span>
      <span id="pdca-arrow-${i}" style="color:var(--text3);font-size:14px">▼</span>
    </div>
    <div class="pdca-body" id="pdca-body-${i}">
      ${[
        ["P", "Planejar", "var(--info)"],
        ["D", "Executar", "var(--green3)"],
        ["C", "Verificar", "var(--gold2)"],
        ["A", "Agir/Ajustar", "var(--red2)"],
      ]
        .map(
          ([letra, nome, c], j) => `
      <div class="pdca-cell">
        <div class="pdca-cell-lbl" style="color:${c}">${letra} — ${nome}</div>
        <div class="pdca-cell-txt">${[p.P, p.D, p.C, p.A][j]}</div>
      </div>`,
        )
        .join("")}
    </div>
  </div>`,
    )
    .join("");
}
// ────────────────────────────────────────────────────────
// TAB 6 — ORIGEM  [A6.1–A6.3]
// ────────────────────────────────────────────────────────
function renderOrigem() {
  const fd = AppState.filteredData;
  const from = AppState.filters.dateFrom,
    to = AppState.filters.dateTo;
  const months = monthsInRange(from.substring(0, 7), to.substring(0, 7));
  const numMonths = months.length;
  const ganhos = fd.filter((r) => r.status === "ganho");
  const no = AppState.rawData.length === 0;
  const allRaw = fd;
  const curMK = `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}`;

  /* Card resumo do período filtrado */
  const mesCardEl = document.getElementById("origem-mes-card");
  if (mesCardEl) {
    if (no) {
      mesCardEl.innerHTML = "";
    } else {
      const periodoV = ganhos.reduce((s, r) => s + r.valor, 0);
      const metaPeriodo = META_TIME_MES * months.length;
      const periodoAt = metaPeriodo > 0 ? (periodoV / metaPeriodo) * 100 : 0;
      const topOri = Object.entries(
        ganhos.reduce((acc, r) => {
          acc[r.origem || "N/I"] = (acc[r.origem || "N/I"] || 0) + r.valor;
          return acc;
        }, {}),
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      mesCardEl.innerHTML = `<div class="card" style="border-top:3px solid var(--info)">
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <div style="font-family:'Poppins';font-size:10px;color:var(--text3);text-transform:uppercase">📌 Período: ${from} → ${to}</div>
        </div>
        <div class="kpi-row c4 mt8" style="gap:8px">
          ${kpiCard("Vendas Período", fmt(periodoV), `Meta: ${fmt(metaPeriodo)}`, "c", periodoAt)}
          ${kpiCard("Atingimento", fmtPct(periodoAt), `${ganhos.length} deals ganhos`, "c", periodoAt)}
          ${kpiCard("Top Origem", topOri[0] ? topOri[0][0] : "—", topOri[0] ? fmt(topOri[0][1]) : "", "b")}
          ${kpiCard("Deals Período", fmtN(ganhos.length), `Ticket: ${fmt(ganhos.length ? periodoV / ganhos.length : 0)}`, "g")}
        </div>
      </div>`;
    }
  }

  /* Performance por Origem — Mês Atual (unfiltered) */
  const mesPerfEl = document.getElementById("origem-mes-table");
  if (no) {
    mesPerfEl.innerHTML = noDataHtml();
    const top10El = document.getElementById("origem-top10");
    if (top10El) top10El.innerHTML = "";
    return;
  }

  // Performance por Origem — Período filtrado
  const mesGanhos = ganhos;
  const origens = [
    ...new Set([
      ...mesGanhos.map((r) => r.origem || "Não informada"),
      ...METAS_ORIGEM.map((m) => m.origem),
    ]),
  ].sort();
  const rows = origens
    .map((ori) => {
      const og = mesGanhos.filter((r) => (r.origem || "Não informada") === ori);
      const real = og.reduce((s, r) => s + r.valor, 0);
      const metaDef = METAS_ORIGEM.find((m) => m.origem === ori);
      const metaMes = metaDef ? metaDef.total : 0;
      const pct = metaMes > 0 ? (real / metaMes) * 100 : 0;
      return {
        ori,
        real,
        metaMes,
        pct,
        deals: og.length,
        ticket: og.length ? real / og.length : 0,
      };
    })
    .sort((a, b) => b.real - a.real);
  const rTotReal = rows.reduce((s, r) => s + r.real, 0),
    rTotMeta = rows.reduce((s, r) => s + r.metaMes, 0),
    rTotDeals = rows.reduce((s, r) => s + r.deals, 0);

  mesPerfEl.innerHTML =
    `<div style="font-family:'Poppins';font-size:10px;color:var(--text3);margin-bottom:6px">Período: ${from} → ${to}</div>` +
    `<table class="dt"><thead><tr>
    <th>Origem</th><th class="num">Negócios</th><th class="num">Realizado</th><th class="num">Meta Mês</th><th class="num">Atingimento</th><th class="num">Ticket Médio</th>
  </tr></thead><tbody>${rows
    .map(
      (r) => `<tr>
    <td>${r.ori}</td>
    <td class="num">${fmtN(r.deals)}</td>
    <td class="num">${fmt(r.real)}</td>
    <td class="num">${fmt(r.metaMes)}</td>
    <td class="num">${pctBadge(r.pct)}</td>
    <td class="num">${fmt(r.ticket)}</td>
  </tr>`,
    )
    .join("")}
  <tr style="border-top:2px solid var(--border-soft);font-weight:700"><td><strong>TOTAL</strong></td><td class="num"><strong>${fmtN(rTotDeals)}</strong></td><td class="num"><strong>${fmt(rTotReal)}</strong></td><td class="num"><strong>${fmt(rTotMeta)}</strong></td><td class="num">${pctBadge(rTotMeta > 0 ? (rTotReal / rTotMeta) * 100 : 0)}</td><td></td></tr>
  </tbody></table>`;

  /* TOP 10 Origens por Tipo — Período filtrado */
  const top10El = document.getElementById("origem-top10");
  if (top10El) {
    const mesDeals = ganhos.slice().sort((a, b) => b.valor - a.valor);
    if (mesDeals.length) {
      // Group by origem, top 10 per group
      const byOri = {};
      mesDeals.forEach((r) => {
        const o = r.origem || "Não informada";
        if (!byOri[o]) byOri[o] = [];
        if (byOri[o].length < 10) byOri[o].push(r);
      });
      const rows10 = Object.entries(byOri).flatMap(([ori, deals]) =>
        deals.map((r, i) => ({ ...r, _ori: ori, _rank: i + 1 })),
      );
      top10El.innerHTML =
        `<div style="font-family:'Poppins';font-size:10px;color:var(--text3);margin-bottom:6px">Período: ${from} → ${to}</div>` +
        `<table class="dt"><thead><tr><th>#</th><th>Origem</th><th>Cliente</th><th>Produto</th><th class="num">Valor</th><th>Consultor</th></tr></thead><tbody>` +
        rows10
          .map(
            (r) => `<tr>
          <td style="color:var(--text3)">${r._rank}</td>
          <td><span class="badge bc" style="font-size:9px">${r._ori.substring(0, 14)}</span></td>
          <td class="hl">${(r.cliente || "—").substring(0, 22)}</td>
          <td>${r.produto}</td>
          <td class="num">${fmt(r.valor)}</td>
          <td>${(r.consultor || "—").split(" ")[0]}</td>
        </tr>`,
          )
          .join("") +
        `</tbody></table>`;
    } else top10El.innerHTML = noDataHtml("Sem vendas no mês atual");
  }

  /* [A6.3] Quadrantes: RETEC S.A. vs RETEC Oeste */
  const quadEl = document.getElementById("origem-quadrantes");
  const empresas = [
    { label: "RETEC S.A.", fn: (e) => !isOeste(e), metaKey: "retec_sa" },
    { label: "RETEC Oeste", fn: isOeste, metaKey: "retec_oeste" },
  ];
  quadEl.innerHTML = empresas
    .map((emp) => {
      const eg = ganhos.filter((r) => emp.fn(r.empresa));
      const eRows = origens
        .map((ori) => {
          const og = eg.filter((r) => (r.origem || "Não informada") === ori);
          const real = og.reduce((s, r) => s + r.valor, 0);
          const metaDef = METAS_ORIGEM.find((m) => m.origem === ori);
          const metaMes = (metaDef ? metaDef[emp.metaKey] : 0) || 0;
          const metaTot = metaMes * numMonths;
          const pct = metaTot > 0 ? (real / metaTot) * 100 : 0;
          return { ori, real, metaTot, pct, deals: og.length };
        })
        .filter((r) => r.real > 0 || r.metaTot > 0)
        .sort((a, b) => b.real - a.real);
      const totalReal = eg.reduce((s, r) => s + r.valor, 0);
      const totalMeta =
        METAS_ORIGEM.reduce((s, m) => s + (m[emp.metaKey] || 0), 0) * numMonths;
      const totalPct = totalMeta > 0 ? (totalReal / totalMeta) * 100 : 0;
      return `<div class="card">
      <div class="card-title" style="color:var(--text)">${emp.label}</div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;flex-wrap:wrap">
        <div style="flex-shrink:0;width:100px">${buildGaugeSVG(totalPct, "Total", "100%")}</div>
        <div>
          <div style="font-size:10px;color:var(--text3)">Realizado</div>
          <div style="font-size:16px;font-family:'Poppins';color:var(--text)">${fmt(totalReal)}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:4px">Meta período</div>
          <div style="font-size:14px;font-family:'Poppins';color:var(--text2)">${fmt(totalMeta)}</div>
        </div>
      </div>
      <table class="dt"><thead><tr><th>Origem</th><th class="num">Real.</th><th class="num">Meta</th><th class="num">%</th></tr></thead>
      <tbody>${eRows
        .map(
          (r) => `<tr>
        <td style="font-size:10px">${r.ori}</td>
        <td class="num">${fmt(r.real)}</td>
        <td class="num">${fmt(r.metaTot)}</td>
        <td class="num">${pctBadge(r.pct)}</td>
      </tr>`,
        )
        .join("")}
      <tr style="border-top:2px solid var(--border-soft);font-weight:700">
        <td><strong>TOTAL</strong></td>
        <td class="num"><strong>${fmt(totalReal)}</strong></td>
        <td class="num"><strong>${fmt(totalMeta)}</strong></td>
        <td class="num">${pctBadge(totalPct)}</td>
      </tr>
      </tbody></table>
    </div>`;
    })
    .join("");

  /* [A6.1] Cards por origem */
  const cardsEl = document.getElementById("origem-cards");
  cardsEl.innerHTML = rows
    .map((r) =>
      kpiCard(
        r.ori,
        fmt(r.real),
        `Meta ${fmt(r.metaMes)} · ${fmtN(r.deals)} deal${r.deals !== 1 ? "s" : ""}`,
        r.pct >= 70 ? "c" : r.pct >= 40 ? "gold" : "r",
        r.pct,
      ),
    )
    .join("");

  /* Consolidado de Metas por Origem — Período filtrado */
  const atEl = document.getElementById("origem-ating-table");
  const ytdGanhos = ganhos;
  const atRows = METAS_ORIGEM.map((m) => {
    const og = ytdGanhos.filter(
      (r) => (r.origem || "Não informada") === m.origem,
    );
    const real = og.reduce((s, r) => s + r.valor, 0);
    const metaAcum = m.total * months.length;
    const pct = metaAcum > 0 ? (real / metaAcum) * 100 : 0;
    const falta = Math.max(0, metaAcum - real);
    return { ori: m.origem, rep: m.pct, real, metaAcum, pct, falta };
  }).sort((a, b) => b.real - a.real);
  const atTotReal = atRows.reduce((s, r) => s + r.real, 0),
    atTotMeta = atRows.reduce((s, r) => s + r.metaAcum, 0);
  atEl.innerHTML =
    `<div style="font-family:'Poppins';font-size:10px;color:var(--text3);margin-bottom:6px">Período: ${from} → ${to}</div>` +
    `<table class="dt"><thead><tr>
    <th>Origem</th><th class="num">Rep.%</th><th class="num">Realizado 2026</th><th class="num">Meta Acumulada</th><th class="num">Atingimento</th><th class="num">Falta Fechar</th>
  </tr></thead><tbody>${atRows
    .map(
      (r) => `<tr>
    <td>${r.ori}</td>
    <td class="num">${r.rep}%</td>
    <td class="num">${fmt(r.real)}</td>
    <td class="num">${fmt(r.metaAcum)}</td>
    <td class="num">${pctBadge(r.pct)}</td>
    <td class="num" style="color:${r.falta > 0 ? "var(--bad)" : "var(--ok)"}">${r.falta > 0 ? fmt(r.falta) : "✓ Meta batida"}</td>
  </tr>`,
    )
    .join("")}
  <tr style="border-top:2px solid var(--border-soft);font-weight:700"><td><strong>TOTAL</strong></td><td></td><td class="num"><strong>${fmt(atTotReal)}</strong></td><td class="num"><strong>${fmt(atTotMeta)}</strong></td><td class="num">${pctBadge(atTotMeta > 0 ? (atTotReal / atTotMeta) * 100 : 0)}</td><td></td></tr>
  </tbody></table>`;
}

// ────────────────────────────────────────────────────────
// TAB 7 — PORTE DO CLIENTE  [A7.1–A7.3]
// ────────────────────────────────────────────────────────
function renderPorte() {
  const fd = AppState.filteredData;
  const ganhos = fd.filter((r) => r.status === "ganho");
  const perdidos = fd.filter((r) => r.status === "perdido");
  const no = AppState.rawData.length === 0;
  const kpisEl = document.getElementById("porte-kpis");
  if (no) {
    kpisEl.innerHTML = noDataHtml();
    document.getElementById("porte-benchmark").innerHTML = "";
    document.getElementById("porte-consultor-table").innerHTML = "";
    document.getElementById("porte-conv-table").innerHTML = "";
    return;
  }

  const lqG = ganhos.filter((r) => r.porte === "LQ");
  const sqG = ganhos.filter((r) => r.porte === "SQ");
  const lqVal = lqG.reduce((s, r) => s + r.valor, 0);
  const sqVal = sqG.reduce((s, r) => s + r.valor, 0);
  const totalVal = lqVal + sqVal;
  const totalDeals = lqG.length + sqG.length;
  const lqTicket = lqG.length ? lqVal / lqG.length : 0;
  const sqTicket = sqG.length
    ? sqG.reduce((s, r) => s + r.valor, 0) / sqG.length
    : 0;
  const lqPctRec = totalVal > 0 ? (lqVal / totalVal) * 100 : 0;
  const sqPctRec = totalVal > 0 ? (sqVal / totalVal) * 100 : 0;
  const lqPctQtd = totalDeals > 0 ? (lqG.length / totalDeals) * 100 : 0;
  const sqPctQtd = totalDeals > 0 ? (sqG.length / totalDeals) * 100 : 0;
  const allDeals = ganhos.length + perdidos.length;
  const convTotal = allDeals > 0 ? (ganhos.length / allDeals) * 100 : 0;
  const lqAll = fd.filter((r) => r.porte === "LQ");
  const sqAll = fd.filter((r) => r.porte === "SQ");
  const convLQ =
    lqAll.length > 0
      ? (lqAll.filter((r) => r.status === "ganho").length / lqAll.length) * 100
      : 0;
  const convSQ =
    sqAll.length > 0
      ? (sqAll.filter((r) => r.status === "ganho").length / sqAll.length) * 100
      : 0;

  /* KPI cards */
  kpisEl.innerHTML = [
    kpiCard(
      "Receita LQ",
      fmt(lqVal),
      `${fmtN(lqG.length)} deals · ${fmtPct(lqPctRec)} da receita · Bench: 70%`,
      "c",
      lqPctRec,
    ),
    kpiCard(
      "Receita SQ",
      fmt(sqVal),
      `${fmtN(sqG.length)} deals · ${fmtPct(sqPctRec)} da receita · Bench: 30%`,
      "",
      sqPctRec,
    ),
    kpiCard("Ticket LQ", fmt(lqTicket), `Conversão LQ: ${fmtPct(convLQ)}`, "c"),
    kpiCard("Ticket SQ", fmt(sqTicket), `Conversão SQ: ${fmtPct(convSQ)}`, ""),
  ].join("");

  /* [A7.1] Benchmark cards */
  const bmEl = document.getElementById("porte-benchmark");
  function benchCard(title, real, bench, label, color) {
    const diff = real - bench;
    const diffSign =
      diff >= 0 ? `+${fmtPct(Math.abs(diff))}` : `-${fmtPct(Math.abs(diff))}`;
    const diffColor = diff >= 0 ? "var(--ok)" : "var(--bad)";
    const barW = Math.min(100, real);
    const benchW = Math.min(100, bench);
    return `<div class="card">
      <div class="card-title">${title}</div>
      <div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);margin-bottom:3px">
          <span>Realizado</span><span style="color:${color};font-weight:700">${fmtPct(real)}</span>
        </div>
        <div class="prog"><div class="prog-fill" style="width:${barW}%;background:${color}"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);margin-top:5px;margin-bottom:3px">
          <span>Benchmark</span><span>${fmtPct(bench)}</span>
        </div>
        <div class="prog"><div class="prog-fill" style="width:${benchW}%;background:var(--text4)"></div></div>
      </div>
      <div style="font-size:11px;font-family:'Poppins'">
        <span style="color:${diffColor};font-weight:700">${diffSign}</span>
        <span style="color:var(--text3)"> vs benchmark · ${label}</span>
      </div>
    </div>`;
  }
  bmEl.innerHTML = [
    benchCard(
      "Distribuição por Quantidade — LQ",
      lqPctQtd,
      20,
      "Benchmark: 20% LQ / 80% SQ (qtd)",
      "var(--info)",
    ) +
      benchCard(
        "Distribuição por Quantidade — SQ",
        sqPctQtd,
        80,
        "Benchmark: 80% SQ / 20% LQ (qtd)",
        "var(--blue)",
      ),
    benchCard(
      "Distribuição por Receita — LQ",
      lqPctRec,
      70,
      "Benchmark: 70% LQ / 30% SQ (receita)",
      "var(--info)",
    ) +
      benchCard(
        "Distribuição por Receita — SQ",
        sqPctRec,
        30,
        "Benchmark: 30% SQ / 70% LQ (receita)",
        "var(--blue)",
      ),
  ]
    .map(
      (
        pair,
        i,
      ) => `<div class="card"><div class="card-title">${i === 0 ? "🔢 Benchmark Quantidade" : "💰 Benchmark Receita"}</div>
    <div class="g2">${pair}</div></div>`,
    )
    .join("");

  /* [A7.2] Por Consultor */
  const consEl = document.getElementById("porte-consultor-table");
  const sellers = [
    ...new Set(ganhos.map((r) => r.consultor).filter(Boolean)),
  ].sort();
  const cRows = sellers
    .map((sel) => {
      const sg = ganhos.filter((r) => r.consultor === sel);
      const slq = sg.filter((r) => r.porte === "LQ");
      const ssq = sg.filter((r) => r.porte === "SQ");
      const sv = sg.reduce((s, r) => s + r.valor, 0);
      const lv = slq.reduce((s, r) => s + r.valor, 0);
      const qv = ssq.reduce((s, r) => s + r.valor, 0);
      const lPctRec = sv > 0 ? (lv / sv) * 100 : 0;
      const qPctRec = sv > 0 ? (qv / sv) * 100 : 0;
      const lPctQtd = sg.length > 0 ? (slq.length / sg.length) * 100 : 0;
      const qPctQtd = sg.length > 0 ? (ssq.length / sg.length) * 100 : 0;
      return {
        sel,
        total: sg.length,
        lqN: slq.length,
        sqN: ssq.length,
        lv,
        qv,
        sv,
        lPctRec,
        qPctRec,
        lPctQtd,
        qPctQtd,
      };
    })
    .sort((a, b) => b.sv - a.sv);
  const ptTotLQ = cRows.reduce((s, r) => s + r.lqN, 0),
    ptTotSQ = cRows.reduce((s, r) => s + r.sqN, 0);
  const ptTotLV = cRows.reduce((s, r) => s + r.lv, 0),
    ptTotQV = cRows.reduce((s, r) => s + r.qv, 0);
  const ptTot = ptTotLQ + ptTotSQ,
    ptTotV = ptTotLV + ptTotQV;
  consEl.innerHTML = cRows.length
    ? `<table class="dt"><thead><tr>
    <th>Consultor</th><th class="num">Total</th><th class="num">LQ (#)</th><th class="num">SQ (#)</th>
    <th class="num">%LQ Qtd</th><th class="num">%SQ Qtd</th>
    <th class="num">Rec. LQ</th><th class="num">Rec. SQ</th>
    <th class="num">%LQ Rec</th><th class="num">%SQ Rec</th>
  </tr></thead><tbody>${cRows
    .map(
      (r) => `<tr>
    <td>${r.sel}</td>
    <td class="num">${r.total}</td>
    <td class="num" style="color:var(--info)">${r.lqN}</td>
    <td class="num" style="color:var(--info)">${r.sqN}</td>
    <td class="num">${pctBadge(r.lPctQtd)}</td>
    <td class="num">${pctBadge(r.qPctQtd)}</td>
    <td class="num" style="color:var(--info)">${fmt(r.lv)}</td>
    <td class="num" style="color:var(--info)">${fmt(r.qv)}</td>
    <td class="num">${pctBadge(r.lPctRec)}</td>
    <td class="num">${pctBadge(r.qPctRec)}</td>
  </tr>`,
    )
    .join("")}
  <tr style="border-top:2px solid var(--border-soft);font-weight:700"><td><strong>TOTAL</strong></td><td class="num"><strong>${ptTot}</strong></td><td class="num"><strong>${ptTotLQ}</strong></td><td class="num"><strong>${ptTotSQ}</strong></td><td class="num">${pctBadge(ptTot > 0 ? (ptTotLQ / ptTot) * 100 : 0)}</td><td class="num">${pctBadge(ptTot > 0 ? (ptTotSQ / ptTot) * 100 : 0)}</td><td class="num"><strong>${fmt(ptTotLV)}</strong></td><td class="num"><strong>${fmt(ptTotQV)}</strong></td><td class="num">${pctBadge(ptTotV > 0 ? (ptTotLV / ptTotV) * 100 : 0)}</td><td class="num">${pctBadge(ptTotV > 0 ? (ptTotQV / ptTotV) * 100 : 0)}</td></tr>
  </tbody></table>`
    : noDataHtml("Sem dados de negócios ganhos no período");

  /* [A7.3] Evolução temporal */
  const convEl = document.getElementById("porte-conv-table");
  const from = AppState.filters.dateFrom,
    to = AppState.filters.dateTo;
  const months = monthsInRange(from.substring(0, 7), to.substring(0, 7));
  const mRows = months.map((mk) => {
    const mg = ganhos.filter((r) => r.monthKey === mk);
    const mp = fd.filter((r) => r.monthKey === mk && r.status === "perdido");
    const mlq = mg.filter((r) => r.porte === "LQ");
    const msq = mg.filter((r) => r.porte === "SQ");
    const mv = mg.reduce((s, r) => s + r.valor, 0);
    const lv = mlq.reduce((s, r) => s + r.valor, 0);
    const qv = msq.reduce((s, r) => s + r.valor, 0);
    const lPctRec = mv > 0 ? (lv / mv) * 100 : 0;
    const tot = mg.length + mp.length;
    const conv = tot > 0 ? (mg.length / tot) * 100 : 0;
    const [y, m] = mk.split("-");
    return {
      label: MONTH_NAMES[+m - 1] + "/" + y.slice(2),
      lqN: mlq.length,
      sqN: msq.length,
      lv,
      qv,
      mv,
      lPctRec,
      conv,
    };
  });
  const cvTotLQ = mRows.reduce((s, r) => s + r.lqN, 0),
    cvTotSQ = mRows.reduce((s, r) => s + r.sqN, 0);
  const cvTotLV = mRows.reduce((s, r) => s + r.lv, 0),
    cvTotQV = mRows.reduce((s, r) => s + r.qv, 0),
    cvTotMV = mRows.reduce((s, r) => s + r.mv, 0);
  convEl.innerHTML = `<table class="dt"><thead><tr>
    <th>Mês</th><th class="num">LQ (#)</th><th class="num">SQ (#)</th>
    <th class="num">Rec. LQ</th><th class="num">Rec. SQ</th><th class="num">%LQ Receita</th><th class="num">Conv. Geral</th>
  </tr></thead><tbody>${mRows
    .map(
      (r) => `<tr>
    <td>${r.label}</td>
    <td class="num" style="color:var(--info)">${r.lqN}</td>
    <td class="num" style="color:var(--info)">${r.sqN}</td>
    <td class="num">${fmt(r.lv)}</td>
    <td class="num">${fmt(r.qv)}</td>
    <td class="num">${pctBadge(r.lPctRec)}</td>
    <td class="num">${pctBadge(r.conv)}</td>
  </tr>`,
    )
    .join("")}
  <tr style="border-top:2px solid var(--border-soft);font-weight:700"><td><strong>TOTAL</strong></td><td class="num"><strong>${cvTotLQ}</strong></td><td class="num"><strong>${cvTotSQ}</strong></td><td class="num"><strong>${fmt(cvTotLV)}</strong></td><td class="num"><strong>${fmt(cvTotQV)}</strong></td><td class="num">${pctBadge(cvTotMV > 0 ? (cvTotLV / cvTotMV) * 100 : 0)}</td><td></td></tr>
  </tbody></table>`;
}

// ────────────────────────────────────────────────────────
// TAB 8 — TIPO DE NEGÓCIO  [A8.1–A8.2]
// ────────────────────────────────────────────────────────
function renderTipo() {
  const fd = AppState.filteredData;
  const from = AppState.filters.dateFrom,
    to = AppState.filters.dateTo;
  const months = monthsInRange(from.substring(0, 7), to.substring(0, 7));
  const numMonths = months.length;
  const ganhos = fd.filter((r) => r.status === "ganho");
  const no = AppState.rawData.length === 0;
  const kpisEl = document.getElementById("tipo-kpis");
  if (no) {
    kpisEl.innerHTML = noDataHtml();
    document.getElementById("tipo-table").innerHTML = "";
    document.getElementById("tipo-consultor-table").innerHTML = "";
    return;
  }

  const PRODUTOS = ["RSS", "Gerenciamento", "Consultoria"];
  const pRows = PRODUTOS.map((prod) => {
    const pg = ganhos.filter((r) => r.produto === prod);
    const allP = fd.filter((r) => r.produto === prod);
    const perd = allP.filter((r) => r.status === "perdido");
    const real = pg.reduce((s, r) => s + r.valor, 0);
    const metaMes = Object.values(METAS_CONSULTOR).reduce(
      (s, m) => s + (m[prod] || 0),
      0,
    );
    const meta = metaMes * numMonths;
    const pct = meta > 0 ? (real / meta) * 100 : 0;
    const conv =
      pg.length + perd.length > 0
        ? (pg.length / (pg.length + perd.length)) * 100
        : 0;
    const ticket = pg.length ? real / pg.length : 0;
    return { prod, real, meta, pct, deals: pg.length, conv, ticket };
  });

  /* KPI cards per tipo */
  kpisEl.innerHTML = pRows
    .map((r) =>
      kpiCard(
        r.prod,
        fmt(r.real),
        `Meta ${fmt(r.meta)} · ${fmtPct(r.pct)} · ${fmtN(r.deals)} deals`,
        r.pct >= 70 ? "c" : r.pct >= 40 ? "gold" : "r",
        r.pct,
      ),
    )
    .join("");

  /* Tabela por tipo */
  const tipoEl = document.getElementById("tipo-table");
  const tTotReal = pRows.reduce((s, r) => s + r.real, 0),
    tTotMeta = pRows.reduce((s, r) => s + r.meta, 0),
    tTotDeals = pRows.reduce((s, r) => s + r.deals, 0);
  tipoEl.innerHTML = `<table class="dt"><thead><tr>
    <th>Produto</th><th class="num">Deals</th><th class="num">Realizado</th><th class="num">Meta Período</th><th class="num">Atingimento</th><th class="num">Conversão</th><th class="num">Ticket Médio</th>
  </tr></thead><tbody>${pRows
    .map(
      (r) => `<tr>
    <td><strong style="color:var(--text)">${r.prod}</strong></td>
    <td class="num">${fmtN(r.deals)}</td>
    <td class="num">${fmt(r.real)}</td>
    <td class="num">${fmt(r.meta)}</td>
    <td class="num">${pctBadge(r.pct)}</td>
    <td class="num">${pctBadge(r.conv)}</td>
    <td class="num">${fmt(r.ticket)}</td>
  </tr>`,
    )
    .join("")}
  <tr style="border-top:2px solid var(--border-soft);font-weight:700"><td><strong>TOTAL</strong></td><td class="num"><strong>${fmtN(tTotDeals)}</strong></td><td class="num"><strong>${fmt(tTotReal)}</strong></td><td class="num"><strong>${fmt(tTotMeta)}</strong></td><td class="num">${pctBadge(tTotMeta > 0 ? (tTotReal / tTotMeta) * 100 : 0)}</td><td></td><td></td></tr>
  </tbody></table>`;

  /* Evolutivo por tipo — chart (always 2026, unfiltered) */
  dc("chart-tipo-evo");
  const cEl = document.getElementById("chart-tipo-evo");
  if (cEl) {
    const colors = {
      RSS: "#bcd6ff",
      Gerenciamento: "#bcd6ff",
      Consultoria: "#d9c8ff",
    };
    const fixedMonths = monthsInRange(
      `${CURRENT_YEAR}-01`,
      `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}`,
    );
    const allGanhos2026 = AppState.rawData.filter(
      (r) =>
        r.status === "ganho" &&
        r.monthKey &&
        r.monthKey.startsWith(String(CURRENT_YEAR)),
    );
    const datasets = PRODUTOS.map((prod) => ({
      label: prod,
      data: fixedMonths.map((mk) =>
        allGanhos2026
          .filter((r) => r.produto === prod && r.monthKey === mk)
          .reduce((s, r) => s + r.valor, 0),
      ),
      borderColor: colors[prod],
      backgroundColor: colors[prod] + "22",
      fill: true,
      tension: 0.3,
      pointRadius: 3,
    }));
    new Chart(cEl, {
      type: "line",
      data: {
        labels: fixedMonths.map((mk) => {
          const [y, m] = mk.split("-");
          return MONTH_NAMES[+m - 1].substring(0, 3) + "/" + y.slice(2);
        }),
        datasets,
      },
      options: {
        ...chartDefaults(),
        plugins: {
          ...chartDefaults().plugins,
          legend: { ...chartDefaults().plugins.legend, display: true },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.raw)}`,
            },
          },
          title: {
            display: true,
            text: "Evolutivo 2026 — não afetado por filtros",
            color: "rgba(255,255,255,.55)",
            font: { size: 10 },
          },
        },
      },
    });
  }

  /* Por Consultor */
  const consEl = document.getElementById("tipo-consultor-table");
  // Use METAS_CONSULTOR keys to ensure all consultants appear
  const sellers = Object.keys(METAS_CONSULTOR);
  const colHeaders = PRODUTOS.map(
    (p) => `<th class="num" colspan="2">${p}</th>`,
  ).join("");
  const colSubs = PRODUTOS.map(
    () => `<th class="num">R$</th><th class="num">%Meta</th>`,
  ).join("");
  const cRows = sellers
    .map((sel) => {
      const cols = PRODUTOS.map((prod) => {
        const sg = ganhos.filter(
          (r) => r.consultor === sel && r.produto === prod,
        );
        const real = sg.reduce((s, r) => s + r.valor, 0);
        const metaCons = METAS_CONSULTOR[sel];
        const metaMes = metaCons ? metaCons[prod] || 0 : 0;
        const meta = metaMes * numMonths;
        const pct = meta > 0 ? (real / meta) * 100 : 0;
        return { real, meta, pct };
      });
      const totalReal = cols.reduce((s, c) => s + c.real, 0);
      return { sel, cols, totalReal };
    })
    .sort((a, b) => b.totalReal - a.totalReal);
  const totCols = PRODUTOS.map((_, pi) => ({
    real: cRows.reduce((s, r) => s + r.cols[pi].real, 0),
    meta: cRows.reduce((s, r) => s + r.cols[pi].meta, 0),
  }));
  consEl.innerHTML = `<table class="dt"><thead>
    <tr><th rowspan="2">Consultor</th>${colHeaders}<th class="num" rowspan="2">Total</th></tr>
    <tr>${colSubs}</tr>
  </thead><tbody>${cRows
    .map(
      (r) => `<tr>
    <td>${r.sel}</td>
    ${r.cols.map((c) => `<td class="num">${fmt(c.real)}</td><td class="num">${pctBadge(c.pct)}</td>`).join("")}
    <td class="num"><strong>${fmt(r.totalReal)}</strong></td>
  </tr>`,
    )
    .join("")}
  <tr style="border-top:2px solid var(--border-soft);font-weight:700"><td><strong>TOTAL</strong></td>
    ${totCols.map((c) => `<td class="num"><strong>${fmt(c.real)}</strong></td><td class="num">${pctBadge(c.meta > 0 ? (c.real / c.meta) * 100 : 0)}</td>`).join("")}
    <td class="num"><strong>${fmt(totCols.reduce((s, c) => s + c.real, 0))}</strong></td>
  </tr>
  </tbody></table>`;
}

// ────────────────────────────────────────────────────────
// TAB 9 — EVOLUTIVO  [A9.1–A9.3]
// ────────────────────────────────────────────────────────
function renderEvolutivo() {
  const fd = AppState.filteredData;
  const allData = AppState.rawData;
  const no = allData.length === 0;
  const cardsEl = document.getElementById("evo-cards");
  if (no) {
    cardsEl.innerHTML = noDataHtml();
    document.getElementById("evo-table").innerHTML = "";
    dc("chart-evo-main");
    return;
  }

  /* Group by year → month → company */
  const years = [
    ...new Set(
      allData
        .filter((r) => r.status === "ganho" && r.data)
        .map((r) => r.data.substring(0, 4)),
    ),
  ].sort();
  const months12 = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );

  /* Receita Mensal por Ano — one line per year, x-axis = Jan–Dez */
  dc("chart-evo-main");
  const cEl = document.getElementById("chart-evo-main");
  const ganhos = allData.filter((r) => r.status === "ganho");
  if (cEl && years.length) {
    const yearColors = [
      "rgba(255,255,255,.55)",
      "#bcd6ff",
      "#bcd6ff",
      "#9effd4",
      "#ffd79e",
      "#d9c8ff",
    ];
    const datasets = years.map((yr, i) => {
      const data = months12.map((m) =>
        ganhos
          .filter((r) => r.monthKey === `${yr}-${m}`)
          .reduce((s, r) => s + r.valor, 0),
      );
      const col = yearColors[i % yearColors.length];
      const isCurrentYear = yr === String(CURRENT_YEAR);
      return {
        label: yr,
        data,
        borderColor: col,
        backgroundColor: col + "22",
        tension: 0.3,
        fill: isCurrentYear,
        pointRadius: isCurrentYear ? 4 : 2,
        borderWidth: isCurrentYear ? 2.5 : 1.5,
        borderDash: isCurrentYear ? [] : [4, 3],
      };
    });
    new Chart(cEl, {
      type: "line",
      data: {
        labels: MONTH_NAMES.map((m) => m.substring(0, 3)),
        datasets,
      },
      options: {
        ...chartDefaults(),
        plugins: {
          ...chartDefaults().plugins,
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.raw)}`,
            },
          },
        },
      },
    });
  }

  /* [A9.1] Cards por ano — ganhos already declared above */
  const evoYears = years.length ? years : [String(CURRENT_YEAR)];
  cardsEl.innerHTML = evoYears
    .map((yr, i) => {
      const yg = ganhos.filter((r) => r.data && r.data.startsWith(yr));
      const vTotal = yg.reduce((s, r) => s + r.valor, 0);
      const byMonth = months12.map((m) =>
        yg
          .filter((r) => r.data && r.data.substring(5, 7) === m)
          .reduce((s, r) => s + r.valor, 0),
      );
      const bestMIdx = byMonth.indexOf(Math.max(...byMonth));
      const bestM = MONTH_NAMES[bestMIdx];
      const prevYr = String(+yr - 1);
      const pvg = ganhos.filter((r) => r.data && r.data.startsWith(prevYr));
      const pvTotal = pvg.reduce((s, r) => s + r.valor, 0);
      const crescimento =
        pvTotal > 0 ? ((vTotal - pvTotal) / pvTotal) * 100 : 0;
      const mese =
        months12.filter((m) => {
          const mk = `${yr}-${m}`;
          return new Date(mk + "-01") <= TODAY;
        }).length || 1;
      const proj = (vTotal / mese) * 12;
      return kpiCard(
        `${yr}`,
        fmt(vTotal),
        `${fmtN(yg.length)} vendas · Melhor: ${bestM} · Cresc: ${crescimento >= 0 ? "+" : ""}${fmtPct(crescimento)} · Proj: ${fmt(proj)}`,
        i === evoYears.length - 1 ? "c" : "",
      );
    })
    .join("");

  /* [A9.2] Tabela comparativa */
  const tableEl = document.getElementById("evo-table");
  const evoTotals = evoYears.map((yr) => {
    const yg = ganhos.filter((r) => r.data && r.data.startsWith(yr));
    const sa = yg
      .filter((r) => !isOeste(r.empresa))
      .reduce((s, r) => s + r.valor, 0);
    const oeste = yg
      .filter((r) => isOeste(r.empresa))
      .reduce((s, r) => s + r.valor, 0);
    return { sa, oeste, tot: sa + oeste };
  });
  tableEl.innerHTML = `<table class="dt"><thead><tr>
    <th>Mês</th>${evoYears.map((y) => `<th class="num">${y} S.A.</th><th class="num">${y} Oeste</th><th class="num">${y} Total</th>`).join("")}
  </tr></thead><tbody>${months12
    .map((m, mi) => {
      const cells = evoYears
        .map((yr) => {
          const mk = `${yr}-${m}`;
          const yg = ganhos.filter((r) => r.monthKey === mk);
          const sa = yg
            .filter((r) => !isOeste(r.empresa))
            .reduce((s, r) => s + r.valor, 0);
          const oeste = yg
            .filter((r) => isOeste(r.empresa))
            .reduce((s, r) => s + r.valor, 0);
          const tot = sa + oeste;
          return `<td class="num">${fmt(sa)}</td><td class="num">${fmt(oeste)}</td><td class="num"><strong>${fmt(tot)}</strong></td>`;
        })
        .join("");
      return `<tr><td>${MONTH_NAMES[mi]}</td>${cells}</tr>`;
    })
    .join("")}
  <tr style="border-top:2px solid var(--border-soft);font-weight:700"><td><strong>TOTAL</strong></td>${evoTotals.map((t) => `<td class="num"><strong>${fmt(t.sa)}</strong></td><td class="num"><strong>${fmt(t.oeste)}</strong></td><td class="num"><strong>${fmt(t.tot)}</strong></td>`).join("")}</tr>
  </tbody></table>`;
}

// ────────────────────────────────────────────────────────
// EXPORT SELLER (WhatsApp PNG via html2canvas)  [A4.2]
// ────────────────────────────────────────────────────────
function exportSeller(idx) {
  /* Find the export card for this seller by index */
  const sellerName = Object.keys(METAS_CONSULTOR)[idx] || "seller";
  const cardId = `export-card-${idx}`;
  const card = document.getElementById(cardId);
  if (!card) {
    alert("Painel não encontrado. Selecione o consultor primeiro.");
    return;
  }
  if (typeof html2canvas === "undefined") {
    alert("html2canvas não disponível.");
    return;
  }
  html2canvas(card, {
    backgroundColor: "#0a0a0a",
    scale: 2,
    useCORS: true,
    width: card.offsetWidth,
    height: card.offsetHeight,
    windowWidth: card.offsetWidth,
    windowHeight: card.offsetHeight,
  })
    .then((canvas) => {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `gvc_seller_${sellerName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    })
    .catch((e) => alert("Erro ao exportar: " + e.message));
}

// ────────────────────────────────────────────────────────
// TOGGLE PDCA (expand/collapse)
// ────────────────────────────────────────────────────────
function togglePDCA(i) {
  const body = document.getElementById("pdca-body-" + i);
  const arrow = document.getElementById("pdca-arrow-" + i);
  if (!body) return;
  const open = body.style.display !== "none";
  body.style.display = open ? "none" : "grid";
  if (arrow) arrow.textContent = open ? "▶" : "▼";
}
