// ==========================================================
// GVC Analytics — API Client v10
// ==========================================================

const API_URL = "api/api_nova.php";
const FALLBACK_PAGE_SIZE = 300;

// ── Barra de progresso ────────────────────────────────────
function showProgress(pct, label) {
  var btn = document.getElementById("btn-atualizar-api");
  if (!btn) return;
  var bar = document.getElementById("load-progress-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "load-progress-bar";
    bar.style.cssText =
      "position:absolute;bottom:0;left:0;height:3px;" +
      "background:linear-gradient(90deg,#9effd4,#bcd6ff);" +
      "border-radius:0 0 12px 12px;transition:width 0.3s ease;width:0%;z-index:10";
    btn.appendChild(bar);
  }
  bar.style.width = Math.min(100, pct) + "%";
  var span = btn.querySelector("span span:last-child");
  if (span) span.textContent = label || "Carregando...";
}

function hideProgress() {
  var bar = document.getElementById("load-progress-bar");
  if (bar) {
    bar.style.width = "100%";
    setTimeout(function () {
      if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    }, 500);
  }
  var span = document.querySelector("#btn-atualizar-api span span:last-child");
  if (span) span.innerHTML = "&#8645; Atualizar dados";
}

// ── Busca todos os deals sequencialmente ─────────────────
async function nextPaint() {
  return new Promise(function (resolve) {
    requestAnimationFrame(function () {
      setTimeout(resolve, 0);
    });
  });
}

async function apiRequest(action, params = {}) {
  var url = new URL(API_URL, window.location.href);

  url.searchParams.set("action", action);

  Object.keys(params).forEach(function (key) {
    url.searchParams.set(key, params[key]);
  });

  var resp = await fetch(url.toString(), {
    headers: {
      "X-Internal-Secret": window.__APP_SECRET__ || "",
    },
  });

  if (!resp.ok) throw new Error("HTTP " + resp.status);

  var json = await resp.json();
  if (json.error) throw new Error(json.error);

  return json;
}

async function fetchTotalDeals() {
  try {
    var json = await apiRequest("count");

    if (Number.isFinite(json.total) && json.total > 0) {
      return json.total;
    }

    return null;
  } catch (e) {
    console.warn("[api-client] Não foi possível obter total real:", e);
    return null;
  }
}

// ── Busca todos os deals com progresso mais realista ──────
async function fetchTodosDeals() {
  var todos = [];
  var skip = 0;
  var hasMore = true;
  var page = 0;

  showProgress(5, "Calculando volume de dados...");
  await nextPaint();

  var totalReal = await fetchTotalDeals();

  if (totalReal) {
    showProgress(8, "Total encontrado: " + totalReal + " negócios");
  } else {
    showProgress(8, "Carregando negócios...");
  }

  await nextPaint();

  while (hasMore) {
    page++;

    var json = await apiRequest("page", { skip: skip });

    var pageData = json.data || [];
    todos = todos.concat(pageData);

    hasMore = !!json.hasMore;
    skip = json.nextSkip || skip + (json.pageSize || FALLBACK_PAGE_SIZE);

    var pct;

    if (totalReal) {
      pct = 10 + Math.min(75, Math.round((todos.length / totalReal) * 75));
      showProgress(pct, todos.length + " de " + totalReal + " negócios...");
    } else {
      // fallback quando a API não informar total
      pct = Math.min(85, 10 + page * 4);
      showProgress(pct, todos.length + " negócios carregados...");
    }

    await nextPaint();
  }

  showProgress(88, todos.length + " negócios recebidos");
  await nextPaint();

  return todos;
}

async function carregarDadosPloomes() {
  var statusEl = document.getElementById("import-status");
  var btnAtualizar = document.getElementById("btn-atualizar-api");

  try {
    if (statusEl) {
      statusEl.textContent = "Carregando dados...";
      statusEl.style.color = "var(--info)";
    }

    if (btnAtualizar) btnAtualizar.disabled = true;

    // Fase 1 — Conexão
    showProgress(4, "Conectando...");
    await nextPaint();

    // Fase 2 — Busca na API
    var rawRows = await fetchTodosDeals();

    if (!rawRows.length) {
      throw new Error("Nenhum registro retornado.");
    }

    // Fase 3 — Normalização local
    showProgress(90, "Normalizando " + rawRows.length + " registros...");
    await nextPaint();

    var dados = [];

    rawRows.forEach(function (row) {
      try {
        var n = normalizeRow(row);
        if (n) dados.push(n);
      } catch (e) {}
    });

    if (!dados.length) {
      throw new Error("Nenhum registro válido após normalização.");
    }

    // Fase 4 — Atualiza estado global
    showProgress(93, "Atualizando dados internos...");
    await nextPaint();

    AppState.rawData = dados;
    AppState.importMeta = {
      filename: "Ploomes API",
      importedAt: new Date().toLocaleString("pt-BR"),
      recordCount: dados.length,
    };

    var dataFmt = new Date().toLocaleDateString("pt-BR");

    ["data-ate", "data-ate-h"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = dataFmt;
    });

    // Fase 5 — Montagem dos filtros
    showProgress(95, "Montando filtros...");
    await nextPaint();

    var emps = [];
    var empSet = {};

    dados.forEach(function (r) {
      if (r.empresa && !empSet[r.empresa]) {
        empSet[r.empresa] = 1;
        emps.push(r.empresa);
      }
    });

    populateEmpresaFilter(emps);

    var cons = [];
    var conSet = {};

    dados.forEach(function (r) {
      if (r.consultor && !conSet[r.consultor]) {
        conSet[r.consultor] = 1;
        cons.push(r.consultor);
      }
    });

    cons.sort();

    var sel = document.getElementById("sel-resp");

    if (sel) {
      sel.innerHTML =
        '<option value="">Todos</option>' +
        cons
          .map(function (c) {
            return '<option value="' + c + '">' + c + "</option>";
          })
          .join("");
    }

    // Fase 6 — Salvar estado local
    showProgress(97, "Salvando estado...");
    await nextPaint();

    saveLS();

    // Fase 7 — Renderização REAL do dashboard
    // Aqui é onde o app.js realmente pesa.
    showProgress(99, "Renderizando dashboard...");
    await nextPaint();

    applyFilters();

    // Aguarda o browser pintar os gráficos/tabelas antes de fechar a barra
    await nextPaint();

    showProgress(100, "Dashboard atualizado");
    await new Promise(function (resolve) {
      setTimeout(resolve, 250);
    });

    hideProgress();

    if (statusEl) {
      statusEl.textContent =
        "\u2713 " + dados.length + " negócios carregados · " + dataFmt;
      statusEl.style.color = "var(--ok)";
    }

    return dados;
  } catch (err) {
    console.error("[api-client]", err);

    hideProgress();

    if (statusEl) {
      statusEl.textContent = "⚠ Erro: " + err.message;
      statusEl.style.color = "var(--bad)";
    }

    throw err;
  } finally {
    if (btnAtualizar) btnAtualizar.disabled = false;
  }
}
