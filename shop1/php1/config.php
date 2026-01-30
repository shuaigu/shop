<?php
/**
 * PHP后端配置文件 - 用于uniapp小程序对话系统
 */

// 数据库配置
define('DB_HOST', '127.0.0.1');
define('DB_USER', 'shop1');
define('DB_PASS', 'shop1');
define('DB_NAME', 'shop1');
define('DB_PORT', 3306);

// API基础配置
define('API_BASE_URL', 'http://localhost/php1/api.php');
define('JWT_SECRET_KEY', 'your-secret-key-change-this-for-production');

// 微信小程序配置
define('WX_APPID', 'wxf7ee79349bd957b8');
define('WX_SECRET', '725f689abdc2c51a36330a813c1b7215');

// 调试模式
define('DEBUG_MODE', true);

// 设置响应头为JSON格式
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 错误报告设置
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}