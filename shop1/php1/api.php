<?php
require_once 'config.php';
require_once 'UserModel.php';
require_once 'MessageModel.php';
require_once 'ArticleModel.php';
require_once 'CategoryModel.php';
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
        $apiPath = str_replace('/api', '', $requestUri);
    }
}
$apiPath = trim($apiPath, '/');

// 获取POST数据
$input = json_decode(file_get_contents('php://input'), true);

// 路由处理
switch ($apiPath) {
    case 'register':
        if ($httpMethod === 'POST') {
            handleRegister($input);
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    case 'login':
        if ($httpMethod === 'POST') {
            handleLogin($input);
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    case 'wx-login':
        if ($httpMethod === 'POST') {
            handleWxLogin($input);
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    case 'profile':
        if ($httpMethod === 'GET') {
            handleGetProfile();
        } elseif ($httpMethod === 'PUT') {
            handleUpdateProfile($input);
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    case 'change-password':
        if ($httpMethod === 'POST') {
            handleChangePassword($input);
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    case 'search-users':
        if ($httpMethod === 'GET') {
            $username = $_GET['q'] ?? '';
            $limit = intval($_GET['limit'] ?? 10);
            handleSearchUsers($username, $limit);
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    case 'conversations':
        if ($httpMethod === 'GET') {
            $page = intval($_GET['page'] ?? 1);
            $limit = intval($_GET['limit'] ?? 10);
            handleGetConversations($page, $limit);
        } elseif ($httpMethod === 'POST') {
            handleCreateConversation($input);
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    case 'conversations/single':
        if ($httpMethod === 'POST') {
            handleCreateSingleConversation($input);
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    case 'conversations/messages':
        if ($httpMethod === 'GET') {
            $conversationId = $_GET['conversation_id'] ?? '';
            $page = intval($_GET['page'] ?? 1);
            $limit = intval($_GET['limit'] ?? 10);
            handleGetConversationMessages($conversationId, $page, $limit);
        } elseif ($httpMethod === 'POST') {
            handleSendMessage($input);
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    case 'conversations/messages/read':
        if ($httpMethod === 'POST') {
            handleMarkMessagesAsRead($input);
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    case 'conversations/messages/unread-count':
        if ($httpMethod === 'GET') {
            handleGetUnreadCount();
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    case 'upload':
        if ($httpMethod === 'POST') {
            handleUpload();
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    case 'articles':
        if ($httpMethod === 'GET') {
            $cate_id = $_GET['cate_id'] ?? '';
            $page = intval($_GET['page'] ?? 1);
            $pageSize = intval($_GET['pageSize'] ?? 10);
            handleGetArticles($cate_id, $page, $pageSize);
        } elseif ($httpMethod === 'POST') {
            handleCreateArticle($input);
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    case 'categories':
        if ($httpMethod === 'GET') {
            handleGetCategories();
        } elseif ($httpMethod === 'POST') {
            handleCreateCategory($input);
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'API端点未找到']);
        break;
}

/**
 * 注册用户
 */
function handleRegister($data) {
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    $nickname = $data['nickname'] ?? null;
    $email = $data['email'] ?? null;
    $phone = $data['phone'] ?? null;
    
    // 参数验证
    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => '用户名和密码不能为空']);
        return;
    }
    
    if (strlen($username) < 3 || strlen($username) > 50) {
        echo json_encode(['success' => false, 'message' => '用户名长度必须在3-50个字符之间']);
        return;
    }
    
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => '密码长度不能少于6位']);
        return;
    }
    
    $userModel = new UserModel();
    $result = $userModel->register($username, $password, $nickname, $email, $phone);
    
    echo json_encode($result);
}

/**
 * 用户登录
 */
function handleLogin($data) {
    // 调试：记录接收到的原始数据
    if (DEBUG_MODE) {
        error_log("Raw input: " . file_get_contents('php://input'));
        error_log("Data received: " . json_encode($data));
    }
    
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    
    // 调试：记录提取后的数据
    if (DEBUG_MODE) {
        error_log("Login attempt - Username: $username, Password: $password");
    }
    
    // 参数验证
    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => '用户名和密码不能为空']);
        return;
    }
    
    $userModel = new UserModel();
    $result = $userModel->login($username, $password);
    
    if (DEBUG_MODE) {
        error_log("Login result: " . json_encode($result));
    }
    
    echo json_encode($result);
}

/**
 * 微信小程序登录
 */
function handleWxLogin($data) {
    $code = $data['code'] ?? '';

    if (empty($code)) {
        echo json_encode(['success' => false, 'message' => 'code 不能为空']);
        return;
    }

    $userModel = new UserModel();
    $loginResult = $userModel->wxLogin($code);
    
    echo json_encode($loginResult);
}

/**
 * 获取用户资料
 */
function handleGetProfile() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        echo json_encode(['success' => false, 'message' => '缺少认证令牌']);
        return;
    }
    
    $token = substr($authHeader, 7); // 去掉 'Bearer ' 前缀
    
    // 验证JWT
    if (JWT::isExpired($token)) {
        echo json_encode(['success' => false, 'message' => '令牌已过期']);
        return;
    }
    
    try {
        $payload = JWT::decode($token);
        $userId = $payload['user_id'];
        
        $userModel = new UserModel();
        $result = $userModel->getUserById($userId);
        
        echo json_encode($result);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}

/**
 * 更新用户资料
 */
function handleUpdateProfile($data) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        echo json_encode(['success' => false, 'message' => '缺少认证令牌']);
        return;
    }
    
    $token = substr($authHeader, 7); // 去掉 'Bearer ' 前缀
    
    // 验证JWT
    if (JWT::isExpired($token)) {
        echo json_encode(['success' => false, 'message' => '令牌已过期']);
        return;
    }
    
    try {
        $payload = JWT::decode($token);
        $userId = $payload['user_id'];
        
        $userModel = new UserModel();
        $result = $userModel->updateUser($userId, $data);
        
        echo json_encode($result);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}

/**
 * 修改密码
 */
function handleChangePassword($data) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        echo json_encode(['success' => false, 'message' => '缺少认证令牌']);
        return;
    }
    
    $token = substr($authHeader, 7); // 去掉 'Bearer ' 前缀
    
    // 验证JWT
    if (JWT::isExpired($token)) {
        echo json_encode(['success' => false, 'message' => '令牌已过期']);
        return;
    }
    
    try {
        $payload = JWT::decode($token);
        $userId = $payload['user_id'];
        
        $oldPassword = $data['old_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';
        
        if (empty($oldPassword) || empty($newPassword)) {
            echo json_encode(['success' => false, 'message' => '旧密码和新密码不能为空']);
            return;
        }
        
        if (strlen($newPassword) < 6) {
            echo json_encode(['success' => false, 'message' => '新密码长度不能少于6位']);
            return;
        }
        
        $userModel = new UserModel();
        $result = $userModel->changePassword($userId, $oldPassword, $newPassword);
        
        echo json_encode($result);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}

/**
 * 搜索用户
 */
function handleSearchUsers($username, $limit) {
    if (empty($username)) {
        echo json_encode(['success' => false, 'message' => '搜索关键词不能为空']);
        return;
    }
    
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        echo json_encode(['success' => false, 'message' => '缺少认证令牌']);
        return;
    }
    
    $token = substr($authHeader, 7); // 去掉 'Bearer ' 前缀
    
    // 验证JWT
    if (JWT::isExpired($token)) {
        echo json_encode(['success' => false, 'message' => '令牌已过期']);
        return;
    }
    
    try {
        $userModel = new UserModel();
        $result = $userModel->searchUsersByUsername($username, $limit);
        
        echo json_encode($result);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}

/**
 * 获取用户会话列表
 */
function handleGetConversations($page, $limit) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        echo json_encode(['success' => false, 'message' => '缺少认证令牌']);
        return;
    }
    
    $token = substr($authHeader, 7); // 去掉 'Bearer ' 前缀
    
    // 验证JWT
    if (JWT::isExpired($token)) {
        echo json_encode(['success' => false, 'message' => '令牌已过期']);
        return;
    }
    
    try {
        $payload = JWT::decode($token);
        $userId = $payload['user_id'];
        
        $messageModel = new MessageModel();
        $result = $messageModel->getUserConversations($userId, $page, $limit);
        
        echo json_encode($result);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}

/**
 * 创建会话
 */
function handleCreateConversation($data) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        echo json_encode(['success' => false, 'message' => '缺少认证令牌']);
        return;
    }
    
    $token = substr($authHeader, 7); // 去掉 'Bearer ' 前缀
    
    // 验证JWT
    if (JWT::isExpired($token)) {
        echo json_encode(['success' => false, 'message' => '令牌已过期']);
        return;
    }
    
    try {
        $payload = JWT::decode($token);
        $userId = $payload['user_id'];
        
        $type = $data['type'] ?? 'single';
        $name = $data['name'] ?? null;
        $members = $data['members'] ?? [];
        
        // 确保创建者在成员列表中
        if (!in_array($userId, $members)) {
            $members[] = $userId;
        }
        
        $messageModel = new MessageModel();
        $result = $messageModel->createConversation($type, $name, $userId, $members);
        
        echo json_encode($result);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}

/**
 * 创建单聊会话
 */
function handleCreateSingleConversation($data) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        echo json_encode(['success' => false, 'message' => '缺少认证令牌']);
        return;
    }
    
    $token = substr($authHeader, 7); // 去掉 'Bearer ' 前缀
    
    // 验证JWT
    if (JWT::isExpired($token)) {
        echo json_encode(['success' => false, 'message' => '令牌已过期']);
        return;
    }
    
    try {
        $payload = JWT::decode($token);
        $currentUserId = $payload['user_id'];
        
        $targetUserId = $data['target_user_id'] ?? null;
        
        if (empty($targetUserId)) {
            echo json_encode(['success' => false, 'message' => '目标用户ID不能为空']);
            return;
        }
        
        if ($currentUserId == $targetUserId) {
            echo json_encode(['success' => false, 'message' => '不能与自己创建单聊会话']);
            return;
        }
        
        $messageModel = new MessageModel();
        $result = $messageModel->createSingleConversation($currentUserId, $targetUserId);
        
        echo json_encode($result);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}

/**
 * 获取会话消息
 */
function handleGetConversationMessages($conversationId, $page, $limit) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        echo json_encode(['success' => false, 'message' => '缺少认证令牌']);
        return;
    }
    
    $token = substr($authHeader, 7); // 去掉 'Bearer ' 前缀
    
    // 验证JWT
    if (JWT::isExpired($token)) {
        echo json_encode(['success' => false, 'message' => '令牌已过期']);
        return;
    }
    
    try {
        $payload = JWT::decode($token);
        $userId = $payload['user_id'];
        
        $messageModel = new MessageModel();
        $result = $messageModel->getMessages($conversationId, $userId, $page, $limit);
        
        echo json_encode($result);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}

/**
 * 发送消息
 */
function handleSendMessage($data) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        echo json_encode(['success' => false, 'message' => '缺少认证令牌']);
        return;
    }
    
    $token = substr($authHeader, 7); // 去掉 'Bearer ' 前缀
    
    // 验证JWT
    if (JWT::isExpired($token)) {
        echo json_encode(['success' => false, 'message' => '令牌已过期']);
        return;
    }
    
    try {
        $payload = JWT::decode($token);
        $senderId = $payload['user_id'];
        
        $conversationId = $data['conversation_id'] ?? null;
        $messageType = $data['message_type'] ?? 'text';
        $content = $data['content'] ?? null;
        $fileUrl = $data['file_url'] ?? null;
        $replyToMessageId = $data['reply_to_message_id'] ?? null;
        
        if (empty($conversationId)) {
            echo json_encode(['success' => false, 'message' => '会话ID不能为空']);
            return;
        }
        
        if (empty($content) && empty($fileUrl)) {
            echo json_encode(['success' => false, 'message' => '消息内容或文件链接不能为空']);
            return;
        }
        
        // 验证消息类型
        $allowedTypes = ['text', 'image', 'file', 'audio', 'video', 'system'];
        if (!in_array($messageType, $allowedTypes)) {
            $messageType = 'text'; // 默认类型
        }
        
        $messageModel = new MessageModel();
        $result = $messageModel->sendMessage($conversationId, $senderId, $messageType, $content, $fileUrl, $replyToMessageId);
        
        echo json_encode($result);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}

/**
 * 标记消息为已读
 */
function handleMarkMessagesAsRead($data) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        echo json_encode(['success' => false, 'message' => '缺少认证令牌']);
        return;
    }
    
    $token = substr($authHeader, 7); // 去掉 'Bearer ' 前缀
    
    // 验证JWT
    if (JWT::isExpired($token)) {
        echo json_encode(['success' => false, 'message' => '令牌已过期']);
        return;
    }
    
    try {
        $payload = JWT::decode($token);
        $userId = $payload['user_id'];
        
        $messageIds = $data['message_ids'] ?? [];
        
        if (empty($messageIds)) {
            echo json_encode(['success' => false, 'message' => '消息ID列表不能为空']);
            return;
        }
        
        $messageModel = new MessageModel();
        $result = $messageModel->markMessageAsRead($messageIds, $userId);
        
        echo json_encode($result);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}

/**
 * 获取未读消息数量
 */
function handleGetUnreadCount() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        echo json_encode(['success' => false, 'message' => '缺少认证令牌']);
        return;
    }
    
    $token = substr($authHeader, 7); // 去掉 'Bearer ' 前缀
    
    // 验证JWT
    if (JWT::isExpired($token)) {
        echo json_encode(['success' => false, 'message' => '令牌已过期']);
        return;
    }
    
    try {
        $payload = JWT::decode($token);
        $userId = $payload['user_id'];
        
        $messageModel = new MessageModel();
        $result = $messageModel->getUnreadCount($userId);
        
        echo json_encode($result);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}

/**
 * 处理文件上传
 */
function handleUpload() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        echo json_encode(['success' => false, 'message' => '缺少认证令牌']);
        return;
    }
    $token = substr($authHeader, 7);
    if (JWT::isExpired($token)) {
        echo json_encode(['success' => false, 'message' => '令牌已过期']);
        return;
    }
    if (!isset($_FILES['file'])) {
        echo json_encode(['success' => false, 'message' => '未找到上传的文件']);
        return;
    }
    $file = $_FILES['file'];
    $uploadDir = 'uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = uniqid() . '.' . $extension;
    $targetPath = $uploadDir . $fileName;
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
        $host = $_SERVER['HTTP_HOST'];
        $dir = dirname($_SERVER['PHP_SELF']);
        $dir = ($dir == '\\' || $dir == '/') ? '' : $dir;
        $fileUrl = $protocol . "://" . $host . $dir . '/' . $targetPath;
        echo json_encode(['success' => true, 'message' => '上传成功', 'data' => ['url' => $fileUrl, 'path' => $targetPath]]);
    } else {
        echo json_encode(['success' => false, 'message' => '文件上传失败']);
    }
}

/**
 * 获取文章列表
 */
function handleGetArticles($cate_id, $page, $pageSize) {
    try {
        $articleModel = new ArticleModel();
        $articles = $articleModel->getArticles($cate_id, $page, $pageSize);
        
        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => $articles
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'code' => -1,
            'message' => '获取文章列表失败: ' . $e->getMessage()
        ]);
    }
}

/**
 * 创建文章
 */
function handleCreateArticle($data) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        echo json_encode(['success' => false, 'message' => '缺少认证令牌']);
        return;
    }
    
    $token = substr($authHeader, 7);
    
    if (JWT::isExpired($token)) {
        echo json_encode(['success' => false, 'message' => '令牌已过期']);
        return;
    }
    
    try {
        $payload = JWT::decode($token);
        $userId = $payload['user_id'];
        
        $data['user_id'] = $userId;
        
        $articleModel = new ArticleModel();
        $result = $articleModel->createArticle($data);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => '发布成功']);
        } else {
            echo json_encode(['success' => false, 'message' => '发布失败']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}

/**
 * 获取分类列表
 */
function handleGetCategories() {
    try {
        $categoryModel = new CategoryModel();
        $categories = $categoryModel->getCategories();
        
        echo json_encode([
            'success' => true,
            'data' => $categories
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => '获取分类列表失败: ' . $e->getMessage()
        ]);
    }
}

/**
 * 创建分类
 */
function handleCreateCategory($data) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        echo json_encode(['success' => false, 'message' => '缺少认证令牌']);
        return;
    }
    
    $token = substr($authHeader, 7);
    
    if (JWT::isExpired($token)) {
        echo json_encode(['success' => false, 'message' => '令牌已过期']);
        return;
    }
    
    try {
        $categoryModel = new CategoryModel();
        $result = $categoryModel->createCategory($data);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => '创建成功']);
        } else {
            echo json_encode(['success' => false, 'message' => '创建失败']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}
