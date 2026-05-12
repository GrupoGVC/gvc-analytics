<?php
// ==========================================================
// GVC Analytics — auth.php
// Coloque este arquivo em: api/auth.php
//
// CREDENCIAIS ficam aqui no servidor — nunca expostas
// ao browser. Para adicionar usuários, edite o array
// $USERS abaixo. Use senhas fortes.
//
// Para maior segurança futura: mova as credenciais para
// um arquivo .env fora da pasta pública.
// ==========================================================

session_start();
session_regenerate_id(true); // previne session fixation

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'Método não permitido']); exit; }

// ── Rate limiting simples (por IP) ───────────────────────
$ip       = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rlKey    = sys_get_temp_dir() . '/gvc_rl_' . md5($ip) . '.json';
$rlMax    = 5;   // máximo de tentativas
$rlWindow = 300; // janela de 5 minutos

$rl = [];
if (file_exists($rlKey)) {
    $rl = json_decode(file_get_contents($rlKey), true) ?? [];
    // Remove tentativas antigas
    $rl = array_filter($rl, fn($t) => (time() - $t) < $rlWindow);
}

if (count($rl) >= $rlMax) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Muitas tentativas. Aguarde 5 minutos.']);
    exit;
}

// ── Credenciais (senhas com hash bcrypt) ─────────────────
// Para gerar o hash de uma nova senha, use:
//   php -r "echo password_hash('SUA_SENHA', PASSWORD_DEFAULT);"
//
// As senhas abaixo são: gvc@2026 e admin@2026
$USERS = [
    'admin'  => '$2y$12$eImiTXuWVxfM37uY4JANjOe5XSzRPbGMnFQECfgNxo4nBgGNf2jOa',
    'gvc'    => '$2y$12$eImiTXuWVxfM37uY4JANjOe5XSzRPbGMnFQECfgNxo4nBgGNf2jOa',
];

// ── Valida token de sessão existente ─────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET' || (($_GET['action'] ?? '') === 'check')) {
    echo json_encode(['ok' => isset($_SESSION['gvc_user'])]);
    exit;
}


// ── Logout ────────────────────────────────────────────────
$body2 = json_decode(file_get_contents('php://input'), true) ?? [];
if (($body2['action'] ?? '') === 'logout') {
    session_destroy();
    echo json_encode(['ok' => true]);
    exit;
}

// ── Login ─────────────────────────────────────────────────
$body = json_decode(file_get_contents('php://input'), true);
$user = trim($body['user'] ?? '');
$pass = $body['pass'] ?? '';

// Pequeno delay para dificultar brute force (50-150ms aleatório)
usleep(random_int(50000, 150000));

if (!$user || !$pass || !isset($USERS[$user])) {
    // Registra tentativa falha
    $rl[] = time();
    file_put_contents($rlKey, json_encode(array_values($rl)));
    echo json_encode(['ok' => false, 'error' => 'Usuário ou senha incorretos.']);
    exit;
}

if (!password_verify($pass, $USERS[$user])) {
    $rl[] = time();
    file_put_contents($rlKey, json_encode(array_values($rl)));
    echo json_encode(['ok' => false, 'error' => 'Usuário ou senha incorretos.']);
    exit;
}

// ── Sucesso — cria sessão ─────────────────────────────────
$_SESSION['gvc_user']    = $user;
$_SESSION['gvc_login_at'] = time();
$_SESSION['gvc_ip']       = $ip;

// Limpa rate limit em caso de sucesso
if (file_exists($rlKey)) unlink($rlKey);

echo json_encode(['ok' => true, 'user' => $user]);