async function submitLogin() {
  var user = document.getElementById("inp-user").value.trim();
  var pass = document.getElementById("inp-pass").value;
  var btn = document.getElementById("btn-login");
  var err = document.getElementById("err-msg");
  var card = document.getElementById("card");

  if (!user || !pass) {
    err.textContent = "Preencha usuário e senha.";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Verificando...";
  err.textContent = "";

  try {
    var resp = await fetch("api/auth.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: user, pass: pass }),
    });

    var json = await resp.json();

    if (json.ok) {
      btn.textContent = "✓ Entrando...";
      btn.style.background = "linear-gradient(135deg,#9effd4,#9effd4)";
      setTimeout(function () {
        window.location.href = "dashboard.html";
      }, 400);
    } else {
      err.textContent = json.error || "Usuário ou senha incorretos.";
      card.classList.remove("shake");
      void card.offsetWidth; // reflow para reiniciar animação
      card.classList.add("shake");
      document.getElementById("inp-pass").value = "";
      btn.disabled = false;
      btn.textContent = "Entrar";
    }
  } catch (e) {
    err.textContent = "Erro de conexão. Tente novamente.";
    btn.disabled = false;
    btn.textContent = "Entrar";
  }
}
