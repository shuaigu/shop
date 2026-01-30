<?php
require_once 'config.php';
require_once 'Database.php';

header('Content-Type: application/json; charset=utf-8');

$db = new Database();
$db->prepare("SELECT id, username, password_hash FROM users WHERE username = '123456'");
$db->execute();
$user = $db->fetch();

if ($user) {
    $password = '123456';
    $verify_result = password_verify($password, $user['password_hash']);
    
    echo json_encode([
        'user_id' => $user['id'],
        'username' => $user['username'],
        'password_hash' => $user['password_hash'],
        'test_password' => $password,
        'verify_result' => $verify_result,
        'hash_info' => password_get_info($user['password_hash'])
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} else {
    echo json_encode(['error' => '用户不存在'], JSON_UNESCAPED_UNICODE);
}
