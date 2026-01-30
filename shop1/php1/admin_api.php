<?php
require_once 'config.php';
require_once 'AdminModel.php';
require_once 'JWT.php';

// 获取HTTP方法和请求路径
$httpMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// 获取路由路径
$apiPath = $_GET['path'] ?? '';
if (empty($apiPath)) {
    $scriptName = $_SERVER['SCRIPT_NAME'];
    if (strpos($requestUri, $scriptName) === 0) {
        $apiPath = substr($requestUri, strlen($scriptName));
    } else {
        $apiPath = str_replace('/admin_api.php', '', $requestUri);
    }
}
$apiPath = trim($apiPath, '/');

$input = json_decode(file_get_contents('php://input'), true);

// 验证管理员身份
function checkAdmin() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        return false;
    }
    $token = substr($authHeader, 7);
    if (JWT::isExpired($token)) {
        return false;
    }
    try {
        $payload = JWT::decode($token);
        // 这里为了简单，我们先检查JWT里是否有admin标识
        // 或者去数据库查询该用户是否为admin
        // 在实际应用中，建议去数据库查
        require_once 'Database.php';
        $db = new Database();
        $db->prepare("SELECT role FROM users WHERE id = :id");
        $db->bind(':id', $payload['user_id']);
        $user = $db->fetch();
        return $user && $user['role'] === 'admin';
    } catch (Exception $e) {
        return false;
    }
}

if (!checkAdmin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => '未经授权的访问']);
    exit;
}

$adminModel = new AdminModel();

switch ($apiPath) {
    case 'stats':
        echo json_encode($adminModel->getStatistics());
        break;
    case 'users':
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? 20);
        echo json_encode($adminModel->getAllUsers($page, $limit));
        break;
    case 'users/status':
        if ($httpMethod === 'POST') {
            $userId = $input['user_id'] ?? null;
            $status = $input['status'] ?? 1;
            echo json_encode($adminModel->updateUserStatus($userId, $status));
        }
        break;
    case 'messages':
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? 50);
        echo json_encode($adminModel->getAllMessages($page, $limit));
        break;
    default:
        echo json_encode(['success' => false, 'message' => '未知的管理接口']);
        break;
}
