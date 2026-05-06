<?php

define('PLOOMES_API_KEY', '***REMOVED***');
define('PLOOMES_BASE_URL', 'https://app10.ploomes.com/');
define('CACHE_TEMPO_SEGUNDOS', 1800);

// ── Headers CORS ─────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Logger ───────────────────────────────────────────────────
function logMsg(string $level, string $msg, array $data = []): void
{
    $entry = [
        'timestamp' => date('c'),
        'level'     => $level,
        'message'   => $msg,
    ];
    if ($data) $entry['data'] = $data;
    error_log(json_encode($entry));
}

// ── Resposta de erro ─────────────────────────────────────────
function erroJson(string $mensagem, int $status = 500): void
{
    http_response_code($status);
    echo json_encode(['error' => ['message' => $mensagem]]);
    exit;
}

// ── Cache em arquivo temporário ──────────────────────────────
function cacheGet(string $chave): mixed
{
    $arquivo = sys_get_temp_dir() . '/ploomes_' . md5($chave) . '.json';
    if (!file_exists($arquivo)) return null;
    if ((time() - filemtime($arquivo)) > CACHE_TEMPO_SEGUNDOS) return null;
    $conteudo = file_get_contents($arquivo);
    return $conteudo ? json_decode($conteudo, true) : null;
}

function cacheSet(string $chave, mixed $dados): void
{
    $arquivo = sys_get_temp_dir() . '/ploomes_' . md5($chave) . '.json';
    file_put_contents($arquivo, json_encode($dados));
}

function cacheLimpar(): void
{
    $arquivos = glob(sys_get_temp_dir() . '/ploomes_*.json');
    foreach ($arquivos as $arquivo) {
        unlink($arquivo);
    }
}

// ── Requisição HTTP para o Ploomes ───────────────────────────
function ploomesRequest(string $endpoint): array
{
    $url = PLOOMES_BASE_URL . $endpoint;

    logMsg('INFO', '[Ploomes] GET ' . $endpoint);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'User-Key: ' . PLOOMES_API_KEY,
            'Content-Type: application/json',
            'Accept: application/json',
            // Headers que o Cloudflare espera ver
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        ],
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_FOLLOWLOCATION => true,  // segue redirecionamentos do Cloudflare
        CURLOPT_ENCODING       => '',    // aceita gzip/deflate
    ]);

    $resposta  = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        logMsg('ERROR', '[Ploomes] cURL error', ['erro' => $curlError]);
        throw new RuntimeException('Falha de conexão: ' . $curlError);
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        logMsg('ERROR', '[Ploomes] HTTP ' . $httpCode, ['endpoint' => $endpoint]);
        throw new RuntimeException("Ploomes retornou HTTP $httpCode");
    }

    $dados = json_decode($resposta, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new RuntimeException('Resposta inválida do Ploomes');
    }

    return $dados;
}

// ── Paginação automática ─────────────────────────────────────
function fetchAllPages(string $endpoint, string $extraParams = ''): array
{
    $todos    = [];
    $skip     = 0;
    $pageSize = 100;
    $hasMore  = true;

    while ($hasMore) {
        $sep      = str_contains($endpoint, '?') ? '&' : '?';
        $paginado = $endpoint . $sep . "\$top={$pageSize}&\$skip={$skip}";
        if ($extraParams) $paginado .= '&' . $extraParams;

        $resposta = ploomesRequest($paginado);
        $itens    = $resposta['value'] ?? [];

        $todos   = array_merge($todos, $itens);
        $hasMore = isset($resposta['@odata.nextLink']) || count($itens) === $pageSize;
        $skip   += $pageSize;

        logMsg('INFO', '[Paginação] Página carregada', [
            'skip'          => $skip,
            'total_parcial' => count($todos),
        ]);
    }

    return $todos;
}

// ── Normalização ─────────────────────────────────────────────
// Converte campos do Ploomes para os nomes usados no dashboard
function normalizarNegocio(array $n): array
{
    $statusMap = [1 => 'pipeline', 2 => 'ganho', 3 => 'perdido'];
    $statusId  = $n['StatusId'] ?? 0;

    return [
        'id'              => $n['Id']              ?? null,
        'titulo'          => $n['Title']            ?? '',
        'status'          => $statusMap[$statusId]  ?? strtolower($n['StatusName'] ?? 'pipeline'),
        'valor'           => (float)($n['Amount']   ?? 0),
        'prop'            => (float)($n['Amount']   ?? 0),
        'pipeline'        => $n['PipelineName']     ?? '',
        'etapa'           => $n['StageName']        ?? '',
        'responsavel'     => $n['OwnerName']        ?? '',
        'data_criacao'    => $n['CreateDate']       ?? null,
        'data_fechamento' => $n['CloseDate']        ?? null,
        'probabilidade'   => (float)($n['Probability'] ?? 0),
        'contato'         => $n['ContactName']      ?? null,
        'empresa'         => $n['AccountName']      ?? null,
        'monthKey'        => isset($n['CloseDate'])
            ? substr($n['CloseDate'], 0, 7)
            : (isset($n['CreateDate']) ? substr($n['CreateDate'], 0, 7) : null),
    ];
}

// ── Actions ──────────────────────────────────────────────────

function actionLoad(array $params): array
{
    $cacheKey = 'load_' . md5(json_encode($params));
    $cached   = cacheGet($cacheKey);
    if ($cached) {
        logMsg('INFO', '[Cache] HIT load');
        return $cached;
    }

    $campos   = 'Id,Title,StatusId,StatusName,Amount,PipelineId,PipelineName,'
        . 'StageId,StageName,OwnerId,OwnerName,CreateDate,CloseDate,'
        . 'Probability,ContactId,ContactName,AccountId,AccountName';
    $endpoint = '/Deals?$select=' . $campos;

    $filtros = [];
    if (!empty($params['dataInicio'])) $filtros[] = "CloseDate ge {$params['dataInicio']}";
    if (!empty($params['dataFim']))    $filtros[]  = "CloseDate le {$params['dataFim']}";
    if (!empty($params['responsavel'])) {
        $resp      = addslashes($params['responsavel']);
        $filtros[] = "OwnerName eq '$resp'";
    }

    $extraParams = !empty($filtros)
        ? '$filter=' . urlencode(implode(' and ', $filtros))
        : '';

    $raw      = fetchAllPages($endpoint, $extraParams);
    $negocios = array_map('normalizarNegocio', $raw);

    $resultado = ['data' => $negocios, 'total' => count($negocios), 'error' => null];
    cacheSet($cacheKey, $resultado);
    return $resultado;
}

function actionLoadResponsaveis(): array
{
    $cached = cacheGet('responsaveis');
    if ($cached) return $cached;

    $resposta = ploomesRequest('/Users?$select=Id,Name&$top=200');
    $lista    = array_map(
        fn($u) => ['id' => $u['Id'], 'nome' => $u['Name']],
        $resposta['value'] ?? []
    );

    $resultado = ['data' => $lista, 'error' => null];
    cacheSet('responsaveis', $resultado);
    return $resultado;
}

function actionLoadPipelines(): array
{
    $cached = cacheGet('pipelines');
    if ($cached) return $cached;

    $resposta = ploomesRequest('/Pipelines?$select=Id,Name');
    $lista    = array_map(
        fn($p) => ['id' => $p['Id'], 'nome' => $p['Name']],
        $resposta['value'] ?? []
    );

    $resultado = ['data' => $lista, 'error' => null];
    cacheSet('pipelines', $resultado);
    return $resultado;
}

function actionHealth(): array
{
    ploomesRequest('/Pipelines?$select=Id,Name&$top=1');
    return [
        'status'            => 'ok',
        'ploomes_conectado' => true,
        'timestamp'         => date('c'),
    ];
}

function actionRefresh(): array
{
    cacheLimpar();
    logMsg('INFO', '[Cache] Limpo por solicitação do usuário');
    return [
        'status'  => 'ok',
        'message' => 'Cache limpo. Próxima requisição buscará dados frescos.',
    ];
}

// ── Roteamento ───────────────────────────────────────────────
try {
    $action = $_GET['action'] ?? $_POST['action'] ?? '';

    $body = [];
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $rawBody = file_get_contents('php://input');
        if ($rawBody) $body = json_decode($rawBody, true) ?? [];
    }

    $params = array_merge($_GET, $body);

    logMsg('INFO', "[Request] action=$action");

    $resultado = match ($action) {
        'load'              => actionLoad($params),
        'load-responsaveis' => actionLoadResponsaveis(),
        'load-pipelines'    => actionLoadPipelines(),
        'health'            => actionHealth(),
        'refresh'           => actionRefresh(),
        default             => throw new InvalidArgumentException("Ação desconhecida: $action"),
    };

    echo json_encode($resultado);
} catch (InvalidArgumentException $e) {
    erroJson($e->getMessage(), 400);
} catch (Throwable $e) {
    logMsg('ERROR', '[Fatal] ' . $e->getMessage());
    erroJson($e->getMessage(), 500);
}
