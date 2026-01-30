<?php
require_once 'config.php';
require_once 'UserModel.php';

header('Content-Type: application/json; charset=utf-8');

// 测试登录
$username = '123456';
$password = '123456';

$userModel = new UserModel();
$result = $userModel->login($username, $password);

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
