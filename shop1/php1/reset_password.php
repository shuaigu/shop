<?php
require_once 'config.php';
require_once 'Database.php';

header('Content-Type: application/json; charset=utf-8');

$username = '123456';
$newPassword = '123456';

try {
    $db = new Database();
    
    // 先检查用户是否存在
    $db->prepare("SELECT id, username FROM users WHERE username = :username");
    $db->bind(':username', $username);
    $db->execute();
    $checkUser = $db->fetch();
    
    if (!$checkUser) {
        echo json_encode([
            'success' => false,
            'message' => '用户不存在'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // 明文密码（临时调试）
    $passwordHash = $newPassword;
    
    // 更新密码
    $db->prepare("UPDATE users SET password_hash = :password_hash WHERE username = :username");
    $db->bind(':password_hash', $passwordHash);
    $db->bind(':username', $username);
    $result = $db->execute();
    
    // 验证更新
    $db->prepare("SELECT id, username, password_hash FROM users WHERE username = :username");
    $db->bind(':username', $username);
    $db->execute();
    $user = $db->fetch();
    
    if (!$user) {
        echo json_encode([
            'success' => false,
            'message' => '查询用户失败'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $verifyResult = ($newPassword === $user['password_hash']);
    
    echo json_encode([
        'success' => true,
        'message' => '密码已重置',
        'data' => [
            'user_id' => $user['id'],
            'username' => $user['username'],
            'new_password' => $newPassword,
            'password_hash' => substr($user['password_hash'], 0, 30) . '...',
            'verify_result' => $verifyResult,
            'update_result' => $result
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => '重置失败: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
