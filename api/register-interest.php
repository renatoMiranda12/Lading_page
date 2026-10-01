<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $statusCode, string $message, bool $success = false): void
{
    http_response_code($statusCode);
    echo json_encode(
        ['success' => $success, 'message' => $message],
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, 'Método não permitido.');
}

$fullName = isset($_POST['full_name']) && is_string($_POST['full_name'])
    ? trim($_POST['full_name'])
    : '';
$email = isset($_POST['email']) && is_string($_POST['email'])
    ? trim($_POST['email'])
    : '';
$phone = isset($_POST['phone']) && is_string($_POST['phone'])
    ? trim($_POST['phone'])
    : '';
$nameLength = preg_match_all('/./us', $fullName, $nameCharacters);
$phoneDigits = preg_replace('/\D+/', '', $phone);

if ($nameLength === false || $nameLength < 3 || $nameLength > 150) {
    respond(422, 'Informe seu nome completo.');
}

if (strlen($email) > 254 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    respond(422, 'Informe um e-mail válido.');
}

if (strlen($phone) > 30 || $phoneDigits === null || strlen($phoneDigits) < 10 || strlen($phoneDigits) > 15) {
    respond(422, 'Informe um número de celular válido com DDD.');
}

$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbName = getenv('DB_NAME') ?: 'mente_inabalavel';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPassword = getenv('DB_PASS') ?: '';

try {
    $database = new PDO(
        "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
        $dbUser,
        $dbPassword,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    $statement = $database->prepare(
        'INSERT INTO interest_registrations (full_name, email, phone) VALUES (:full_name, :email, :phone)'
    );
    $statement->execute([
        'full_name' => $fullName,
        'email' => $email,
        'phone' => $phone,
    ]);

    respond(201, 'Cadastro salvo com sucesso.', true);
} catch (Throwable $error) {
    error_log('Interest registration failed: ' . $error->getMessage());
    respond(500, 'Não foi possível salvar seus dados agora. Tente novamente em instantes.');
}
