# GVC Analytics

Dashboard analítico de vendas do Grupo GVC. Consome a API do Ploomes CRM em tempo real através de um proxy PHP, renderiza KPIs, rankings, funil de vendas e análises por consultor, origem, porte e tipo de negócio — tudo em uma interface dark com glassmorphism.

![Status](https://img.shields.io/badge/status-em%20produção-brightgreen)
![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?logo=php&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

**Produção:** [analytics.drc-gvc.tech](https://analytics.drc-gvc.tech)

---

## Arquitetura

```
Browser (HTML / CSS / JS)
    │
    ├─ fetch('api/api_nova.php?action=load')
    │       ↓
    │   api_nova.php  (proxy PHP v14 — esconde a User-Key)
    │       ↓  curl paginado (300 deals/página)
    │   api2.ploomes.com  (PipelineId 49305)
    │       ↓
    │   JSON normalizado → browser
    │
    └─ fetch('api/auth.php')
            ↓
        HMAC-SHA256 token (localStorage, TTL 8h)
```

O proxy PHP é 100% dinâmico: não possui mapas hardcoded de stages, owners ou tags. Toda resolução de nomes acontece via `$expand` direto na API do Ploomes. Apenas o endpoint de Tags é cacheado em disco (TTL 10 min) para performance.

---

## Funcionalidades

O dashboard possui 10 abas navegáveis pela sidebar:

| Aba | O que mostra |
|-----|-------------|
| **Consolidado** | Visão geral: mix de produtos, origens, funil resumido, porte do cliente (split bars quantitativo/qualitativo), forecast e tabela por consultor |
| **Ranking** | Ranking de consultores por faturamento com comparativo de metas |
| **Funil** | KPIs de conversão, tabela de estágios do pipeline, motivos de perda e visualização de pipeline |
| **Seller** | Painel individual por consultor — dual-view (período filtrado + mês atual), metas por categoria (RSS, Gerenciamento, Consultoria) |
| **Gestor** | Visão gerencial com análise de prioridades, alavancas de receita e PDCA por consultor |
| **Origem** | Análise por canal de aquisição (Indicação, Inbound, Outbound, etc.) |
| **Porte** | Segmentação por porte do cliente (LQ / SQ) com benchmarks e distribuição |
| **Tipo** | Distribuição por tipo de negócio / serviço |
| **Evolutivo** | Série temporal mês a mês com gráficos de tendência |
| **Marcadores** | Análise por tags aplicadas aos negócios no Ploomes |

Recursos adicionais: filtros por data e empresa, botão de atualização manual, exportação de cards para WhatsApp via html2canvas, e tela de login com rate limiting (5 tentativas / 5 min).

---

## Stack

**Frontend** — HTML5, CSS3 (custom properties, glassmorphism, responsivo), JavaScript vanilla, Chart.js, html2canvas, Poppins + Source Serif 4 (self-hosted)

**Backend** — PHP 8.2 (proxy + auth), nginx 1.24, Ubuntu 24 (VPS Hostinger)

**CRM** — Ploomes API (`api2.ploomes.com`)

**Infra** — VPS Hostinger, Certbot SSL, GitHub para versionamento, deploy via SCP

---

## Estrutura do Projeto

```
gvc-analytics/
│
├── api/
│   ├── api_nova.php        # Proxy Ploomes v14 — paginação, cache, $expand
│   ├── auth.php             # Login HMAC-SHA256, rate limiting, bcrypt
│   └── config.php           # Carrega .env, define constantes (API key, pipeline, etc.)
│
├── assets/
│   ├── fonts/               # Poppins (woff2) + Source Serif 4
│   ├── img/
│   │   └── background.mp4   # Vídeo de fundo da tela de login
│   └── logos/               # Ícones e logos do Grupo GVC (192px, 512px)
│
├── css/
│   ├── index.css            # Estilos do dashboard (variáveis, layout, cards, gráficos)
│   ├── index-responsivo.css # Media queries do dashboard
│   ├── login.css            # Estilos da tela de login
│   └── login-responsivo.css # Media queries do login
│
├── js/
│   ├── config.js            # Estado global (AppState), constantes, metas, utilitários
│   ├── app.js               # Funções de renderização de todas as abas
│   ├── api-client.js        # Fetch paginado ao proxy PHP, barra de progresso
│   ├── init.js              # Bootstrap: verifica token, carrega dados, inicia Chart.js
│   ├── index.js             # Guard síncrono de autenticação, logout, filtros
│   ├── login.js             # Lógica de submit do formulário de login
│   └── vendor.chart.js      # Chart.js (bundled)
│
├── html/                    # (reservado)
├── index.html               # Dashboard principal
├── login.html               # Tela de login
├── .env                     # Variáveis de ambiente (não versionado)
├── .env.example             # Template de variáveis
├── .gitignore
└── README.md
```

---

## Pré-requisitos

- PHP 8.2+ com extensões `curl` e `json`
- nginx (ou Apache com mod_rewrite)
- Chave de API do Ploomes (User-Key)
- Node/npm **não é necessário** — o frontend é vanilla JS

---

## Configuração Local

1. Clone o repositório:

```bash
git clone https://github.com/GrupoGVC/gvc_analytics.git
cd gvc_analytics
```

2. Copie e preencha o arquivo de ambiente:

```bash
cp .env.example .env
```

```env
PLOOMES_API_KEY="sua_chave_ploomes"
API_INTERNAL_SECRET="chave_interna"
APP_ENV=development
TOKEN_SECRET="segredo_para_tokens_hmac"
```

3. Suba um servidor PHP local:

```bash
php -S localhost:8080
```

4. Acesse `http://localhost:8080` no navegador.

---

## Deploy (VPS)

O projeto roda em `root@72.61.42.148:/var/www/gvc-analytics/` com nginx + PHP-FPM.

**Upload via SCP (PowerShell):**

```powershell
scp -r "C:\Users\Kaique Rios\Desktop\gvc_analytics\*" root@72.61.42.148:/var/www/gvc-analytics/
```

**Ajustar permissões no VPS:**

```bash
chown -R www-data:www-data /var/www/gvc-analytics/
chmod -R 755 /var/www/gvc-analytics/
```

**Configuração nginx** (já ativa em `/etc/nginx/sites-enabled/gvc-analytics`):

```nginx
server {
    listen 443 ssl;
    server_name analytics.drc-gvc.tech;
    root /var/www/gvc-analytics;
    index index.html index.php;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    }
}
```

---

## Notas Técnicas

**Sidebar fora do `.layout`** — O `backdrop-filter` aplicado ao `.layout` cria um stacking context que quebra `position: fixed` da sidebar em dispositivos móveis reais (funciona no DevTools mas falha em produção). A sidebar precisa viver fora desse container.

**Ploomes API** — `$expand` e `$orderby` juntos podem causar 403. O campo `CloseDate` é bloqueado na API (usar `FinishDate`). Campos em `OtherProperties` não são acessíveis pela API pública.

**Paginação no browser** — Páginas sequenciais de 300 deals direto do browser resolveram timeouts que ocorriam com bulk fetch server-side.

**CSS custom properties** — Variáveis ausentes no `:root` renderizam silenciosamente como `transparent`. Toda variável referenciada em JS precisa estar declarada no CSS.

**Autenticação** — Tokens HMAC-SHA256 no `localStorage` (PHP sessions eram incompatíveis com o setup nginx porta 8083 → 443). O `auth.php` implementa rate limiting por IP com bcrypt para senhas.

---

## Sobre o Grupo GVC

O Grupo GVC atua na gestão, valorização e tratamento de resíduos, promovendo soluções sustentáveis e inovadoras para o setor ambiental — compostagem, beneficiamento de agregados reciclados, produção de biogás e tratamento de chorume.

[grupogvc.eco.br](https://grupogvc.eco.br/)

---

## Licença

MIT