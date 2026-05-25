<?php
// Carrega o .env em ambiente local
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        putenv(trim($key) . '=' . trim($value));
        $_ENV[trim($key)] = trim($value);
    }
}

// Constantes da aplicação
define('PLOOMES_API_KEY',  getenv('PLOOMES_API_KEY') ?: '');
define('PLOOMES_BASE_URL', 'https://api2.ploomes.com');
define('PAGE_SIZE',        200);
define('PIPELINE_ID',      49305);
define('APP_ENV',          getenv('APP_ENV') ?: 'production');

// Erros
if (APP_ENV === 'development') {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}

// Validação
if (empty(PLOOMES_API_KEY)) {
    http_response_code(500);
    echo json_encode(['error' => 'PLOOMES_API_KEY não configurada.']);
    exit;
}
