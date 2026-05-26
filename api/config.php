<?php
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $value = trim($value, " \"'");
        putenv(trim($key) . '=' . $value);
        $_ENV[trim($key)] = $value;
    }
}

define('PLOOMES_API_KEY',      getenv('PLOOMES_API_KEY')      ?: '');
define('API_INTERNAL_SECRET',  getenv('API_INTERNAL_SECRET')  ?: '');
define('TOKEN_SECRET',         getenv('TOKEN_SECRET')         ?: '');
define('APP_ENV',              getenv('APP_ENV')              ?: 'production');
define('PLOOMES_BASE_URL',     'https://api2.ploomes.com');
define('PAGE_SIZE',            300);
define('PIPELINE_ID',          49305);

if (APP_ENV === 'development') {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}

// Valida as duas constantes críticas
if (empty(PLOOMES_API_KEY) || empty(TOKEN_SECRET)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Servidor mal configurado.']);
    exit;
}