// Verificação síncrona — sem fetch, sem async
// Roda antes de tudo no body
(function () {
  var token = localStorage.getItem("gvc_token");
  if (!token) {
    window.location.replace("login.html");
  }
})();

function logout() {
  localStorage.removeItem("gvc_token");
  localStorage.removeItem("gvc_user");
  window.location.replace("login.html");
}

function confirmDateFilter() {
  if (typeof applyFilters === "function") applyFilters();
}
