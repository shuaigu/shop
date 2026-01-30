<?php
require_once 'config.php';
require_once 'Database.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = new Database();
    
    // 查询所有用户
    $db->prepare("SELECT id, username, nickname, created_at FROM users ORDER BY id DESC LIMIT 10");
    $db->execute();
    $users = $db->fetchAll();
    
    echo json_encode([
        'success' => true,
        'message' => '查询成功',
        'data' => $users,
        'count' => count($users)
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => '查询失败: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
