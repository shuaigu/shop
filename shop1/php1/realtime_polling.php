<?php
/**
 * 实时消息轮询接口
 * 用于uniapp小程序的消息同步
 */

require_once 'config.php';
require_once 'Database.php';
require_once 'JWT.php';
require_once 'MessageModel.php';

// 获取POST数据
$input = json_decode(file_get_contents('php://input'), true);

// 获取HTTP方法和请求路径
$httpMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 移除URL中的/realtime部分（如果存在）
$apiPath = str_replace('/realtime', '', $requestUri);
$apiPath = trim($apiPath, '/');

switch ($apiPath) {
    case 'poll-messages':
        if ($httpMethod === 'POST') {
            handlePollMessages($input);
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    case 'sync-conversations':
        if ($httpMethod === 'POST') {
            handleSyncConversations($input);
        } else {
            echo json_encode(['success' => false, 'message' => '请求方法不允许']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'API端点未找到']);
        break;
}

/**
 * 轮询新消息
 */
function handlePollMessages($data) {
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
        
        // 获取最后检查时间戳
        $lastCheckTime = $data['last_check_time'] ?? (time() - 3600); // 默认查询过去一小时
        
        $db = new Database();
        
        // 查询用户参与的会话中有新消息的会话
        $sql = "
            SELECT DISTINCT c.id as conversation_id, 
                   (SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = c.id AND m.created_at > FROM_UNIXTIME(:last_check_time)) as newest_msg_time
            FROM conversations c
            JOIN conversation_members cm ON c.id = cm.conversation_id
            JOIN messages m ON c.id = m.conversation_id
            WHERE cm.user_id = :user_id 
              AND m.created_at > FROM_UNIXTIME(:last_check_time)
            ORDER BY newest_msg_time DESC
        ";
        
        $db->prepare($sql);
        $db->bind(':user_id', $userId);
        $db->bind(':last_check_time', $lastCheckTime);
        $conversationsWithNewMsgs = $db->fetchAll();
        
        $newMessages = [];
        
        // 对于每个有新消息的会话，获取具体的新消息
        foreach ($conversationsWithNewMsgs as $conv) {
            $convId = $conv['conversation_id'];
            
            $msgSql = "
                SELECT m.*, u.username, u.nickname, u.avatar
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = :conversation_id 
                  AND m.created_at > FROM_UNIXTIME(:last_check_time)
                ORDER BY m.created_at ASC
            ";
            
            $db->prepare($msgSql);
            $db->bind(':conversation_id', $convId);
            $db->bind(':last_check_time', $lastCheckTime);
            $msgs = $db->fetchAll();
            
            foreach ($msgs as $msg) {
                $newMessages[] = $msg;
            }
        }
        
        // 更新这些消息为已读状态（对于当前用户）
        if (!empty($newMessages)) {
            $messageIds = array_column($newMessages, 'id');
            $msgModel = new MessageModel();
            $msgModel->markMessageAsRead($messageIds, $userId);
        }
        
        echo json_encode([
            'success' => true, 
            'data' => [
                'new_messages' => $newMessages,
                'newest_timestamp' => time(),
                'count' => count($newMessages)
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}

/**
 * 同步会话列表（检查是否有新的会话或会话更新）
 */
function handleSyncConversations($data) {
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
        
        // 获取最后同步时间戳
        $lastSyncTime = $data['last_sync_time'] ?? (time() - 86400); // 默认查询过去24小时
        
        $db = new Database();
        
        // 查询自上次同步以来更新的会话
        $sql = "
            SELECT c.id, c.type, c.name, c.avatar, c.created_at, c.updated_at,
                   (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
                   (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id) as last_message_time,
                   (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_content,
                   (SELECT sender_id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_sender_id
            FROM conversations c
            JOIN conversation_members cm ON c.id = cm.conversation_id
            WHERE cm.user_id = :user_id 
              AND c.updated_at > FROM_UNIXTIME(:last_sync_time)
            ORDER BY c.updated_at DESC
        ";
        
        $db->prepare($sql);
        $db->bind(':user_id', $userId);
        $db->bind(':last_sync_time', $lastSyncTime);
        $updatedConversations = $db->fetchAll();
        
        // 获取新增的会话
        $newConvSql = "
            SELECT c.id, c.type, c.name, c.avatar, c.created_at, c.updated_at,
                   (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count
            FROM conversations c
            JOIN conversation_members cm ON c.id = cm.conversation_id
            WHERE cm.user_id = :user_id 
              AND c.created_at > FROM_UNIXTIME(:last_sync_time)
              AND c.id NOT IN (SELECT id FROM conversations WHERE updated_at > FROM_UNIXTIME(:last_sync_time))
        ";
        
        $db->prepare($newConvSql);
        $db->bind(':user_id', $userId);
        $db->bind(':last_sync_time', $lastSyncTime);
        $newConversations = $db->fetchAll();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'updated_conversations' => $updatedConversations,
                'new_conversations' => $newConversations,
                'sync_timestamp' => time()
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '令牌无效']);
    }
}