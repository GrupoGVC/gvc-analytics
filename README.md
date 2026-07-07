<h1 align="center">GVC Analytics</h1>

<p align="center">
  <img src="https://img.shields.io/badge/status-em%20produção-brightgreen" />
  <img src="https://img.shields.io/badge/PHP-8.2-777BB4?logo=php&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/nginx-1.24-009639?logo=nginx&logoColor=white" />
  <img src="https://img.shields.io/badge/license-MIT-blue" />
</p>

<p align="center">
  Dashboard analítico de vendas do Grupo GVC, com integração em tempo real com o CRM Ploomes,
  KPIs, rankings, funil de vendas e análises segmentadas por consultor, origem, porte e tipo de negócio.
</p>

<p align="center">
  <a href="https://analytics.drc-gvc.tech">🔗 Acessar Dashboard em Produção</a>
</p>

---

## 📋 Descrição do Projeto

O **GVC Analytics** é uma plataforma web interna do Grupo GVC que centraliza indicadores comerciais consumidos diretamente do CRM Ploomes via API REST. Desenvolvido com HTML, CSS e JavaScript puro no frontend e um proxy PHP no backend, o sistema exibe em tempo real o desempenho de consultores, origem de leads, porte de clientes e evolução de receita.

**Repositório:** [github.com/GrupoGVC/gvc-display](https://github.com/GrupoGVC/gvc-display)

---

## ⚙️ Funcionalidades do Projeto

- 📊 **Consolidado** — visão geral com mix de produtos, funil resumido, porte do cliente (split bars LQ/SQ) e forecast
- 🏆 **Ranking** — ranking de consultores por faturamento com comparativo de metas e badges de performance
- 🔽 **Funil** — KPIs de conversão por estágio, motivos de perda e visualização do pipeline
- 👤 **Seller** — painel individual por consultor com dual-view (período filtrado + mês atual) e metas por categoria
- 📋 **Gestor** — visão gerencial com prioridades, alavancas de receita e análise PDCA
- 📍 **Origem** — distribuição por canal de aquisição (Indicação, Inbound, Outbound etc.)
- 🏢 **Porte** — segmentação por porte do cliente com benchmarks e distribuição percentual
- 🗂️ **Tipo** — breakdown por tipo de negócio e serviço
- 📈 **Evolutivo** — série temporal mês a mês com gráficos de tendência
- 🏷️ **Marcadores** — análise por tags aplicadas aos negócios no Ploomes
- 🔐 **Autenticação** — login com bcrypt + token HMAC-SHA256 no `localStorage` (TTL 8h), rate limiting de 5 tentativas / 5 min
- 📤 **Exportação** — exportar cards para imagem via html2canvas (compartilhamento no WhatsApp)
- 🔄 **Atualização manual** — botão para forçar recarga dos dados com barra de progresso
- 🎛️ **Filtros** — filtrar por período (data início/fim) e por empresa

---

## 🧪 Testes de Software

| Tipo | Descrição |
|------|-----------|
| **Autenticação** | Validação de token expirado, logout forçado e redirecionamento para `login.html` |
| **Rate limiting** | Verificação do bloqueio após 5 tentativas de login incorretas em 5 minutos |
| **Paginação da API** | Coleta sequencial de 300 deals/página até esgotar os registros do pipeline |
| **Cache do proxy** | Validação do TTL de 10 min para o endpoint de Tags; limpeza via botão de atualização |
| **Compatibilidade mobile** | Sidebar `position: fixed` testada em dispositivos reais (iOS/Android) — sidebar deve estar fora do `.layout` para evitar quebra por `backdrop-filter` |
| **Variáveis CSS** | Todas as `custom properties` declaradas no `:root` para evitar render transparente silencioso |
| **Filtros** | Filtro por data e empresa aplicado globalmente a todas as abas |

---

## 🛠️ Tecnologias e Linguagens

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?logo=php&logoColor=white)
![nginx](https://img.shields.io/badge/nginx-1.24-009639?logo=nginx&logoColor=white)
![Ubuntu](https://img.shields.io/badge/Ubuntu-24-E95420?logo=ubuntu&logoColor=white)

---

## 📦 Bibliotecas e Frameworks

| Biblioteca | Uso |
|---|---|
| [Chart.js](https://www.chartjs.org/) | Gráficos de barras, linha, doughnut e radar |
| [html2canvas](https://html2canvas.hertzen.com/) | Exportação de cards como imagem para WhatsApp |
| [Poppins](https://fonts.google.com/specimen/Poppins) | Fonte principal (self-hosted, woff2) |
| [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4) | Fonte secundária (self-hosted, woff2) |

> Todas as bibliotecas são carregadas como arquivos locais (`js/vendor.*.js`) — sem CDN externo em runtime.

---

## 📝 Pré-requisitos e Instalação

**Requisitos:**
- PHP 8.2+ com extensões `curl` e `json` habilitadas
- nginx ou Apache com suporte a PHP-FPM
- Chave de API do Ploomes (User-Key)
- Acesso ao pipeline `49305` no Ploomes

**Passos:**

```bash
# 1. Clone o repositório
git clone https://github.com/GrupoGVC/gvc-display.git
cd gvc-display

# 2. Configure as variáveis de ambiente
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
PLOOMES_API_KEY="sua_user_key_do_ploomes"
API_INTERNAL_SECRET="chave_interna_qualquer"
APP_ENV=development
TOKEN_SECRET="segredo_para_tokens_hmac"
```

```bash
# 3. Suba o servidor PHP local
php -S localhost:8080

# 4. Acesse no navegador
# http://localhost:8080
```

---

## ▶️ Instruções de Uso

1. Acesse [analytics.drc-gvc.tech](https://analytics.drc-gvc.tech) (ou `localhost:8080` em ambiente local)
2. Faça login com suas credenciais (usuários gerenciados em `api/auth.php`)
3. Os dados do Ploomes são carregados automaticamente ao entrar
4. Use o botão **↕ Atualizar dados** na sidebar para forçar recarga
5. Filtre por período e empresa nos controles da sidebar
6. Navegue pelas abas do menu lateral para explorar cada análise

**Credenciais padrão (ambiente local):**
```
Usuário: admin
Senha: (definida no hash bcrypt em auth.php)
```

---

## 📚 Documentação

| Recurso | Link |
|---------|------|
| Ploomes API REST | [developers.ploomes.com](https://developers.ploomes.com) |
| Chart.js Docs | [chartjs.org/docs](https://www.chartjs.org/docs/latest/) |
| html2canvas Docs | [html2canvas.hertzen.com](https://html2canvas.hertzen.com/) |
| PHP 8.2 | [php.net/docs](https://www.php.net/docs.php) |
| nginx Docs | [nginx.org/docs](https://nginx.org/en/docs/) |

**Restrições conhecidas da API Ploomes:**
- `$expand` + `$orderby` juntos retornam 403 — usar separadamente
- `CloseDate` bloqueado — substituir por `FinishDate`
- `OtherProperties` (campos customizados) inacessíveis via API pública
- Tags devem ser buscadas via `$expand=Tags($select=TagId)` + endpoint `/Tags`

---

## 📁 Estrutura do Projeto

```
gvc-analytics/
├── api/
│   ├── api_nova.php        # Proxy Ploomes v14 — paginação, cache, $expand
│   ├── auth.php            # Login HMAC-SHA256, rate limiting, bcrypt
│   └── config.php          # Carrega .env, define constantes globais
├── assets/
│   ├── fonts/              # Poppins + Source Serif 4 (woff2, self-hosted)
│   ├── img/background.mp4  # Vídeo de fundo da tela de login
│   └── logos/              # Logos do Grupo GVC (ico, 192px, 512px)
├── css/
│   ├── index.css           # Estilos do dashboard (variáveis, layout, cards)
│   ├── index-responsivo.css
│   ├── login.css
│   └── login-responsivo.css
├── js/
│   ├── config.js           # AppState, constantes, metas, utilitários
│   ├── app.js              # Funções de renderização de todas as abas
│   ├── api-client.js       # Fetch paginado ao proxy, barra de progresso
│   ├── init.js             # Bootstrap: verifica token, carrega dados
│   ├── index.js            # Guard síncrono de auth, logout, filtros
│   ├── login.js            # Lógica do formulário de login
│   └── vendor.chart.js     # Chart.js (bundled local)
├── index.html              # Dashboard principal
├── login.html              # Tela de login
├── .env                    # Variáveis de ambiente (não versionado)
├── .env.example            # Template de variáveis
└── README.md
```

---

## 📜 Licença

Distribuído sob a licença **MIT**. Uso restrito ao Grupo GVC. Consulte o arquivo `LICENSE` para detalhes.

---

## 🤝 Contribuição

Contribuições internas são bem-vindas! Para propor mudanças:

1. Abra uma issue descrevendo o problema ou melhoria
2. Faça um fork e crie uma branch seguindo o padrão abaixo
3. Abra um Pull Request com descrição clara das alterações

---

## 🌿 Gitflow

| Tipo | Padrão de branch | Exemplo |
|------|-----------------|---------|
| Nova funcionalidade | `feature/nome` | `feature/aba-metas-dinamicas` |
| Correção de bug | `fix/nome` | `fix/sidebar-mobile` |
| Hotfix urgente | `hotfix/nome` | `hotfix/token-expirado` |
| Atualização de docs | `docs/nome` | `docs/readme-atualizado` |

**Commits semânticos:**
```
feat: adiciona aba de metas dinâmicas via API Ploomes
fix: corrige posicionamento da sidebar em mobile
refactor: extrai lógica de paginação para api-client.js
docs: atualiza README com instruções de deploy
style: ajusta custom properties ausentes no :root
```

**Fluxo padrão:**
```bash
git checkout -b feature/minha-feature
# desenvolve...
git add .
git commit -m "feat: descrição da mudança"
git push origin feature/minha-feature
# abre Pull Request para main
```

---

<p align="center">
  Desenvolvido pelo <a href="https://grupogvc.eco.br">Grupo GVC</a>
</p>