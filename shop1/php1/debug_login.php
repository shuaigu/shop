<?php
require_once 'config.php';
require_once 'UserModel.php';

header('Content-Type: text/plain; charset=utf-8');

echo "=== Debug Login API ===\n\n";

// 模拟接收数据
$rawInput = file_get_contents('php://input');
echo "Raw POST input: $rawInput\n\n";

// 解析JSON
$data = json_decode($rawInput, true);
echo "Parsed data: " . print_r($data, true) . "\n\n";

// 提取用户名和密码
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

echo "Username: $username\n";
echo "Password: $password\n\n";

// 尝试登录
if (!empty($username) && !empty($password)) {
    $userModel = new UserModel();
    $result = $userModel->login($username, $password);
    echo "Login result: " . json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
} else {
    echo "Username or password is empty!\n";
}
