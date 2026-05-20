<?php
// ==========================================================
// GVC Analytics — auth.php
// ==========================================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

define('TOKEN_SECRET', 'gvc_secret_2026_xK9pL');
define('TOKEN_TTL', 28800); // 8 horas

function makeToken(string $user): string {
    $exp = time() + TOKEN_TTL;
    $data = $user . '|' . $exp;
    $sig = hash_hmac('sha256', $data, TOKEN_SECRET);
    return base64_encode($data . '|' . $sig);
}

function verifyToken(string $token): bool {
    $decoded = base64_decode($token);
    $parts   = explode('|', $decoded);
    if (count($parts) !== 3) return false;
    [$user, $exp, $sig] = $parts;
    if (time() > (int)$exp) return false;
    $expected = hash_hmac('sha256', $user . '|' . $exp, TOKEN_SECRET);
    return hash_equals($expected, $sig);
}

// ── Verificar token (GET) ─────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $token = $_GET['token'] ?? '';
    echo json_encode(['ok' => $token !== '' && verifyToken($token)]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];

// ── Logout ────────────────────────────────────────────────
if (($body['action'] ?? '') === 'logout') {
    echo json_encode(['ok' => true]);
    exit;
}

// ── Rate limiting ─────────────────────────────────────────
$ip      = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rlKey   = sys_get_temp_dir() . '/gvc_rl_' . md5($ip) . '.json';
$rlMax   = 5;
$rlWin   = 300;
$rl      = [];
if (file_exists($rlKey)) {
    $rl = json_decode(file_get_contents($rlKey), true) ?? [];
    $rl = array_filter($rl, fn($t) => (time() - $t) < $rlWin);
}
if (count($rl) >= $rlMax) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Muitas tentativas. Aguarde 5 minutos.']);
    exit;
}

// ── Credenciais ───────────────────────────────────────────
$USERS = [
    'admin' => '$2y$10$MazNsblwLLajqV1SzXFKhelnPxVPaWk3ASRcKhR5cBakLTND7c9Lq',
    'gvc'   => '$2y$10$MazNsblwLLajqV1SzXFKhelnPxVPaWk3ASRcKhR5cBakLTND7c9Lq',
];

$user = trim($body['user'] ?? '');
$pass = $body['pass'] ?? '';

usleep(random_int(50000, 150000));

if (!$user || !$pass || !isset($USERS[$user]) || !password_verify($pass, $USERS[$user])) {
    $rl[] = time();
    file_put_contents($rlKey, json_encode(array_values($rl)));
    echo json_encode(['ok' => false, 'error' => 'Usuário ou senha incorretos.']);
    exit;
}

if (file_exists($rlKey)) unlink($rlKey);
echo json_encode(['ok' => true, 'token' => makeToken($user), 'user' => $user]);