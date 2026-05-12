// Verifica sessão antes de mostrar o dashboard
(function () {
  fetch("api/auth.php?action=check", { credentials: "include" })
    .then(function (r) {
      return r.json();
    })
    .then(function (j) {
      if (!j.ok) window.location.href = "login.html";
    })
    .catch(function () {
      window.location.href = "login.html";
    });
})();

function logout() {
  fetch("api/auth.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "logout" }),
    credentials: "include",
  }).finally(function () {
    window.location.href = "login.html";
  });
}
