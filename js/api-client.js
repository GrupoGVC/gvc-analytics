// ==========================================================
// GVC Analytics — API Client v10
// ==========================================================

const API_URL = "api/api_nova.php";
const PAGE_SIZE = 200;

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
async function fetchTodosDeals() {
  var todos = [];
  var skip = 0;
  var hasMore = true;
  var pagina = 0;

  showProgress(4, "Conectando ao Ploomes...");

  while (hasMore) {
    pagina++;

    var pct = Math.min(88, 8 + Math.log2(pagina + 1) * 22);
    showProgress(pct, pagina + "ª página · " + todos.length + " negócios...");

    var resp = await fetch(API_URL + "?action=page&skip=" + skip, {
      headers: { "X-Internal-Secret": window.__APP_SECRET__ || "" },
    });
    if (!resp.ok) throw new Error("HTTP " + resp.status);

    var json = await resp.json();
    if (json.error) throw new Error(json.error);

    todos = todos.concat(json.data || []);
    hasMore = json.hasMore;
    skip += PAGE_SIZE;
  }

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
    var rawRows = await fetchTodosDeals();

    // Fase 3 — Processamento local (88→95%)
    // Esse trecho é síncrono e rápido, mas vale mostrar
    showProgress(92, "Normalizando " + rawRows.length + " registros...");

    if (!rawRows.length) throw new Error("Nenhum registro retornado.");

    var dados = [];
    rawRows.forEach(function (row) {
      try {
        var n = normalizeRow(row);
        if (n) dados.push(n);
      } catch (e) {}
    });

    if (!dados.length)
      throw new Error("Nenhum registro válido após normalização.");

    // Fase 4 — Aplicando filtros e renderizando (95→100%)
    showProgress(96, "Montando dashboard...");

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

    var emps = [],
      empSet = {};
    dados.forEach(function (r) {
      if (r.empresa && !empSet[r.empresa]) {
        empSet[r.empresa] = 1;
        emps.push(r.empresa);
      }
    });
    populateEmpresaFilter(emps);

    var cons = [],
      conSet = {};
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

    showProgress(99, "Renderizando...");
    saveLS();

    // Pequeno delay para o browser renderizar o 99% antes de fechar
    await new Promise(function (resolve) {
      setTimeout(resolve, 120);
    });

    hideProgress();

    if (statusEl) {
      statusEl.textContent =
        "\u2713 " + dados.length + " negócios carregados · " + dataFmt;
      statusEl.style.color = "var(--ok)";
    }

    applyFilters();
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
