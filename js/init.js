document.addEventListener("DOMContentLoaded", () => {
  populateEmpresaFilter([]);
  document.getElementById("current-date").textContent =
    TODAY.toLocaleDateString("pt-BR");

  const dtFrom = document.getElementById("dt-from");
  const dtTo = document.getElementById("dt-to");
  if (dtFrom && !dtFrom.value) dtFrom.value = DEFAULT_DATE_FROM;
  if (dtTo) dtTo.value = DEFAULT_DATE_TO;

  const pl = document.getElementById("period-label");
  if (pl) pl.textContent = `${DEFAULT_DATE_FROM} → ${DEFAULT_DATE_TO}`;

  if (typeof Chart !== "undefined") {
    Chart.defaults.color = "rgba(255,255,255,.82)";
    Chart.defaults.font.family = "Poppins";
  }

  // Verifica token antes de carregar dados
  var token = localStorage.getItem("gvc_token");
  if (!token) {
    window.location.replace("login.html");
    return;
  }

  fetch("api/auth.php?token=" + encodeURIComponent(token))
    .then(function (r) {
      return r.json();
    })
    .then(function (j) {
      if (!j.ok) {
        localStorage.removeItem("gvc_token");
        localStorage.removeItem("gvc_user");
        window.location.replace("login.html");
      } else {
        carregarDadosPloomes().catch(function () {
          if (!loadLS()) updateDashboard();
        });
      }
    })
    .catch(function () {
      window.location.replace("login.html");
    });

  const vid = document.querySelector("video.bg-video");
  if (vid) {
    vid.addEventListener("loadedmetadata", () => {
      try {
        vid.play();
      } catch (e) {}
    });
    document.addEventListener(
      "click",
      () => {
        try {
          vid.play();
        } catch (e) {}
      },
      { once: true },
    );
  }
});
