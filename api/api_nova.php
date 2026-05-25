<?php
// ==========================================================
// GVC Analytics — Proxy PHP para API Ploomes v14
// 100% dinâmico
// ==========================================================

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://analytics.drc-gvc.tech');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

set_time_limit(30);
ini_set('memory_limit', '128M');

// ── Helpers ───────────────────────────────────────────────
function erroJson(string $msg, int $status = 500): void
{
    http_response_code($status);
    echo json_encode(['error' => $msg]);
    exit;
}

function cacheFile(string $key): string
{
    return sys_get_temp_dir() . '/gvc_' . md5($key) . '.json';
}

function cacheRead(string $key, int $ttl = 600): mixed
{
    $f = cacheFile($key);
    if (!file_exists($f) || (time() - filemtime($f)) > $ttl) return null;
    $c = file_get_contents($f);
    return $c ? json_decode($c, true) : null;
}

function cacheWrite(string $key, mixed $data): void
{
    file_put_contents(cacheFile($key), json_encode($data));
}

function cacheLimpar(): void
{
    foreach (glob(sys_get_temp_dir() . '/gvc_*.json') as $f) unlink($f);
}

// ── Requisição ao Ploomes ─────────────────────────────────
function ploomesGet(string $endpoint): array
{
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

// ── Tags cacheadas (evita 1 req extra por página) ─────────
function getTagMap(): array
{
    $cached = cacheRead('tags', 3600);
    if ($cached) return $cached;

    $tags = [];
    try {
        $r = ploomesGet('/Tags?$select=Id,Name&$top=200');
        foreach ($r['value'] ?? [] as $t) {
            if (!empty($t['Name'])) $tags[(string)$t['Id']] = $t['Name'];
        }
    } catch (Throwable) {
    }

    cacheWrite('tags', $tags);
    return $tags;
}

// ── Normalização ──────────────────────────────────────────
function getOtherProp(array $props, int $fieldId): string
{
    $vals = [];
    foreach ($props as $p) {
        if (($p['FieldId'] ?? 0) !== $fieldId) continue;
        $v = $p['ObjectValueName'] ?? $p['StringValue'] ?? $p['BigStringValue'] ?? '';
        if ($v !== '') $vals[] = $v;
    }
    return implode('; ', $vals);
}

function getMarcadores(array $tags, array $tagMap): string
{
    $vals = [];
    foreach ($tags as $t) {
        $nome = $tagMap[(string)($t['TagId'] ?? '')] ?? '';
        if ($nome !== '' && !in_array($nome, $vals)) $vals[] = $nome;
    }
    return implode('; ', $vals);
}

function normalizarDeal(array $d, array $tagMap): array
{
    $statusMap = [1 => 'Pipeline', 2 => 'Ganha', 3 => 'Perdida'];
    $props     = $d['OtherProperties'] ?? [];
    $tags      = $d['Tags']            ?? [];

    return [
        'Titulo'             => $d['Title']                    ?? '',
        'Cliente'            => $d['Title']                    ?? '',
        'Valor'              => (float)($d['Amount']           ?? 0),
        'Situação'           => $statusMap[$d['StatusId'] ?? 0] ?? 'Pipeline',
        'Estágio'            => $d['Stage']['Name']            ?? '',
        'Responsável'        => $d['Owner']['Name']            ?? '',
        'Motivo de perda'    => $d['LossReason']['Name']       ?? '',
        'Origem'             => $d['Origin']['Name']           ?? '',
        'Data de Criação'    => $d['CreateDate']               ?? '',
        'Data de Fechamento' => $d['FinishDate']               ?? '',
        'Término'            => $d['FinishDate']               ?? '',
        'Empresa Vendedora'  => getOtherProp($props, 325257),
        'Empresa'            => getOtherProp($props, 325257),
        'Tipo de Venda'      => getOtherProp($props, 347280),
        'Meio de contato'    => getOtherProp($props, 327549),
        'Marcadores'         => getMarcadores($tags, $tagMap),
    ];
}

// ── Actions ───────────────────────────────────────────────
function actionPage(): array
{
    $skip   = max(0, (int)($_GET['skip'] ?? 0));
    $top    = PAGE_SIZE;
    $campos = 'Id,Title,Amount,StatusId,CreateDate,FinishDate,StageId,OwnerId,LossReasonId,OriginId';
    $expand = implode(',', [
        'OtherProperties',
        'Stage($select=Id,Name)',
        'Owner($select=Id,Name)',
        'Origin($select=Id,Name)',
        'LossReason($select=Id,Name)',
        'Tags($select=TagId)',
    ]);

    $tagMap = getTagMap();

    $ep   = '/Deals?$select=' . $campos
        . '&$expand=' . $expand
        . '&$top=' . $top . '&$skip=' . $skip
        . '&$filter=PipelineId%20eq%20' . PIPELINE_ID;

    $resp = ploomesGet($ep);
    $raw  = $resp['value'] ?? [];
    $data = array_map(fn($d) => normalizarDeal($d, $tagMap), $raw);

    return [
        'data'    => $data,
        'count'   => count($data),
        'skip'    => $skip,
        'hasMore' => count($raw) === $top,
    ];
}

function actionStages(): array
{
    $resp = ploomesGet('/DealStages?$select=Id,Name&$top=100');
    return ['stages' => $resp['value'] ?? []];
}

function actionHealth(): array
{
    ploomesGet('/Users?$select=Id,Name&$top=1');
    return ['status' => 'ok', 'timestamp' => date('c')];
}

function actionRefresh(): array
{
    cacheLimpar();
    return ['status' => 'ok', 'message' => 'Cache limpo.'];
}

function actionDebug(): array
{
    $skip   = (int)($_GET['skip'] ?? 0);
    $campos = 'Id,Title,Amount,StatusId,CreateDate,FinishDate,StageId,OwnerId,LossReasonId,OriginId';
    $expand = implode(',', [
        'OtherProperties',
        'Stage($select=Id,Name)',
        'Owner($select=Id,Name)',
        'Origin($select=Id,Name)',
        'LossReason($select=Id,Name)',
        'Tags($select=TagId)',
    ]);
    $ep = '/Deals?$select=' . $campos
        . '&$expand=' . $expand
        . '&$top=5&$skip=' . $skip
        . '&$filter=PipelineId%20eq%20' . PIPELINE_ID;
    return ploomesGet($ep);
}

function actionTags(): array
{
    $r = ploomesGet('/Tags?$select=Id,Name&$top=200');
    return ['tags' => $r['value'] ?? []];
}

function actionFields(): array
{
    $r = ploomesGet('/Fields?$select=Id,Key,Name,EntityId&$top=200');
    return ['fields' => $r['value'] ?? []];
}

// ── Roteamento ────────────────────────────────────────────
try {
    $action = $_GET['action'] ?? 'page';

    $resultado = match ($action) {
        'page'    => actionPage(),
        'stages'  => actionStages(),
        'health'  => actionHealth(),
        'refresh' => actionRefresh(),
        'debug'   => actionDebug(),
        'tags'    => actionTags(),
        'fields'  => actionFields(),
        default   => throw new InvalidArgumentException("Ação desconhecida: $action"),
    };

    echo json_encode($resultado);
} catch (InvalidArgumentException $e) {
    erroJson($e->getMessage(), 400);
} catch (Throwable $e) {
    erroJson($e->getMessage(), 500);
}
