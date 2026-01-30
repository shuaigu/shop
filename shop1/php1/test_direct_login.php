<?php
require_once 'config.php';
require_once 'Database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$username = '123456';
$password = '123456';

$db = new Database();

// 查询用户
$db->prepare("SELECT id, username, password_hash FROM users WHERE username = :username");
$db->bind(':username', $username);
$db->execute();
$user = $db->fetch();

if (!$user) {
    echo json_encode(['error' => '用户不存在'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'user_found' => true,
    'user_id' => $user['id'],
    'username' => $user['username'],
    'stored_password' => $user['password_hash'],
    'input_password' => $password,
    'match_result' => ($password === $user['password_hash']),
    'comparison_type' => 'direct string comparison (===)'
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
