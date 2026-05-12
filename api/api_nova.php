<?php
// ==========================================================
// GVC Analytics — Proxy PHP para API Ploomes v9
// Estratégia simples: uma página por request, sem timeout
// ==========================================================

define('PLOOMES_API_KEY', '');
define('PLOOMES_BASE_URL', 'https://api2.ploomes.com');
define('PAGE_SIZE', 200); // pequeno o suficiente para responder rápido

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

set_time_limit(30);
ini_set('memory_limit', '128M');

// ── Helpers ──────────────────────────────────────────────
function erroJson(string $msg, int $status = 500): void {
    http_response_code($status);
    echo json_encode(['error' => $msg]);
    exit;
}

// ── Mapa de usuários (cacheado separadamente, leve) ───────
function cacheFile(string $key): string {
    return sys_get_temp_dir() . '/gvc_' . md5($key) . '.json';
}

function cacheRead(string $key, int $ttl = 600): mixed {
    $f = cacheFile($key);
    if (!file_exists($f) || (time() - filemtime($f)) > $ttl) return null;
    $c = file_get_contents($f);
    return $c ? json_decode($c, true) : null;
}

function cacheWrite(string $key, mixed $data): void {
    file_put_contents(cacheFile($key), json_encode($data));
}

function cacheLimpar(): void {
    foreach (glob(sys_get_temp_dir() . '/gvc_*.json') as $f) unlink($f);
}

// ── Requisição ao Ploomes ─────────────────────────────────
function ploomesGet(string $endpoint): array {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => PLOOMES_BASE_URL . $endpoint,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'User-Key: ' . PLOOMES_API_KEY,
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        CURLOPT_TIMEOUT        => 25,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_ENCODING       => '',
    ]);
    $resp      = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) throw new RuntimeException('cURL: ' . $curlError);
    if ($httpCode < 200 || $httpCode >= 300)
        throw new RuntimeException("Ploomes HTTP $httpCode");

    $data = json_decode($resp, true);
    if (json_last_error() !== JSON_ERROR_NONE)
        throw new RuntimeException('JSON inválido');
    return $data;
}

// ── Mapas de lookup ───────────────────────────────────────
function getMapas(): array {
    $cached = cacheRead('mapas', 3600); // 1 hora
    if ($cached) return $cached;

    $owners = [];
    try {
        $r = ploomesGet('/Users?$select=Id,Name&$top=200');
        foreach ($r['value'] ?? [] as $u) $owners[(string)$u['Id']] = $u['Name'];
    } catch (Throwable) {}

    $mapas = [
        'owners' => $owners,
        'stages' => [
            '147860' => 'Contrato',   '147861' => 'Conexão',
            '147862' => 'Negociação', '147864' => 'Fechamento',
            '150115' => 'Novos Leads',
        ],
        'losses' => [
            '94969'  => 'Oportunidade futura',
            '94970'  => 'Preço de Transporte',
            '94971'  => 'Fechou com concorrente',
            '96611'  => 'Preço de destinação final',
            '96612'  => 'Cliente Deixou de responder',
            '96613'  => 'Preferiu manter o fornecedor atual',
            '111910' => 'Perda automática',
        ],
    ];

    cacheWrite('mapas', $mapas);
    return $mapas;
}

// ── Normaliza deal ────────────────────────────────────────
function getOtherProp(array $props, int $fieldId): string {
    foreach ($props as $p) {
        if (($p['FieldId'] ?? 0) !== $fieldId) continue;
        return $p['ObjectValueName'] ?? $p['StringValue'] ?? $p['BigStringValue'] ?? '';
    }
    return '';
}

function normalizarDeal(array $d, array $maps): array {
    $statusMap = [1 => 'Pipeline', 2 => 'Ganha', 3 => 'Perdida'];
    $props   = $d['OtherProperties'] ?? [];
    $stageId = (string)($d['StageId']      ?? '');
    $ownerId = (string)($d['OwnerId']      ?? '');
    $lossId  = (string)($d['LossReasonId'] ?? '');

    return [
        'Titulo'            => $d['Title']  ?? '',
        'Cliente'           => $d['Title']  ?? '',
        'Valor'             => (float)($d['Amount'] ?? 0),
        'Situação'          => $statusMap[$d['StatusId'] ?? 0] ?? 'Pipeline',
        'Estágio'           => $maps['stages'][$stageId] ?? $stageId,
        'Responsável'       => $maps['owners'][$ownerId] ?? $ownerId,
        'Motivo de perda'   => $lossId ? ($maps['losses'][$lossId] ?? $lossId) : '',
        'Data de Criação'   => $d['CreateDate']  ?? '',
        'Data de Fechamento'=> $d['FinishDate']  ?? '',
        'Término'           => $d['FinishDate']  ?? '',
        'Empresa Vendedora' => getOtherProp($props, 325257),
        'Empresa'           => getOtherProp($props, 325257),
        'Tipo de Venda'     => getOtherProp($props, 347280),
        'Meio de contato'   => getOtherProp($props, 327549),
        'Origem'            => '',
    ];
}

// ── Actions ───────────────────────────────────────────────

// Busca UMA página do Ploomes e retorna normalizada
// ?action=page&skip=0, &skip=200, &skip=400, ...
function actionPage(): array {
    $skip = max(0, (int)($_GET['skip'] ?? 0));
    $top  = PAGE_SIZE;
    $campos = 'Id,Title,Amount,StatusId,CreateDate,FinishDate,OwnerId,StageId,LossReasonId';

    $maps = getMapas();

    $ep   = '/Deals?$select=' . $campos . '&$expand=OtherProperties&$top=' . $top . '&$skip=' . $skip;
    $resp = ploomesGet($ep);
    $raw  = $resp['value'] ?? [];

    $data = array_map(fn($d) => normalizarDeal($d, $maps), $raw);

    return [
        'data'    => $data,
        'count'   => count($data),
        'skip'    => $skip,
        'hasMore' => count($raw) === $top,
    ];
}

function actionHealth(): array {
    ploomesGet('/Users?$select=Id,Name&$top=1');
    return ['status' => 'ok', 'timestamp' => date('c')];
}

function actionRefresh(): array {
    cacheLimpar();
    return ['status' => 'ok', 'message' => 'Cache limpo.'];
}

// ── Roteamento ────────────────────────────────────────────
try {
    $action = $_GET['action'] ?? 'page';

    $resultado = match ($action) {
        'page'    => actionPage(),
        'health'  => actionHealth(),
        'refresh' => actionRefresh(),
        default   => throw new InvalidArgumentException("Ação desconhecida: $action"),
    };

    echo json_encode($resultado);

} catch (InvalidArgumentException $e) {
    erroJson($e->getMessage(), 400);
} catch (Throwable $e) {
    erroJson($e->getMessage(), 500);
}