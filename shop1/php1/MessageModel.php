<?php
require_once 'Database.php';

/**
 * 消息模型类
 */
class MessageModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * 创建新的会话
     */
    public function createConversation($type, $name = null, $creatorId = null, $members = []) {
        try {
            $this->db->beginTransaction();
            
            // 创建会话
            $this->db->prepare(
                "INSERT INTO conversations (type, name, creator_id) 
                 VALUES (:type, :name, :creator_id)"
            );
            $this->db->bind(':type', $type);
            $this->db->bind(':name', $name);
            $this->db->bind(':creator_id', $creatorId);
            $this->db->execute();
            
            $conversationId = $this->db->lastInsertId();
            
            // 添加成员到会话
            if (!empty($members)) {
                foreach ($members as $userId) {
                    $this->db->prepare(
                        "INSERT INTO conversation_members (conversation_id, user_id, role) 
                         VALUES (:conversation_id, :user_id, :role)"
                    );
                    $this->db->bind(':conversation_id', $conversationId);
                    $this->db->bind(':user_id', $userId);
                    $this->db->bind(':role', $userId == $creatorId ? 'owner' : 'member');
                    $this->db->execute();
                }
            }
            
            $this->db->commit();
            
            return ['success' => true, 'data' => ['id' => $conversationId]];
        } catch (Exception $e) {
            $this->db->rollback();
            return ['success' => false, 'message' => '创建会话失败: ' . $e->getMessage()];
        }
    }

    /**
     * 获取用户的会话列表
     */
    public function getUserConversations($userId, $page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        
        // 获取用户参与的所有会话
        $this->db->prepare(
            "SELECT DISTINCT c.id, c.type, c.name, c.avatar, c.created_at, c.updated_at,
                    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
                    (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id) as last_message_time,
                    (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_content,
                    (SELECT sender_id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_sender_id
             FROM conversations c
             JOIN conversation_members cm ON c.id = cm.conversation_id
             WHERE cm.user_id = :user_id AND c.is_active = TRUE
             ORDER BY c.updated_at DESC
             LIMIT :limit OFFSET :offset"
        );
        $this->db->bind(':user_id', $userId);
        $this->db->bind(':limit', $limit, PDO::PARAM_INT);
        $this->db->bind(':offset', $offset, PDO::PARAM_INT);
        
        $conversations = $this->db->fetchAll();
        
        // 为每个会话获取参与者信息
        foreach ($conversations as &$conversation) {
            $this->db->prepare(
                "SELECT u.id, u.username, u.nickname, u.avatar 
                 FROM users u 
                 JOIN conversation_members cm ON u.id = cm.user_id 
                 WHERE cm.conversation_id = :conversation_id 
                 LIMIT 5" // 只取前5个成员作为预览
            );
            $this->db->bind(':conversation_id', $conversation['id']);
            $conversation['participants'] = $this->db->fetchAll();
        }
        
        return ['success' => true, 'data' => $conversations];
    }

    /**
     * 获取会话中的消息
     */
    public function getMessages($conversationId, $userId, $page = 1, $limit = 50) {
        // 首先检查用户是否有权限访问此会话
        $this->db->prepare(
            "SELECT COUNT(*) as count 
             FROM conversation_members 
             WHERE conversation_id = :conversation_id AND user_id = :user_id"
        );
        $this->db->bind(':conversation_id', $conversationId);
        $this->db->bind(':user_id', $userId);
        $result = $this->db->fetch();
        
        if ($result['count'] == 0) {
            return ['success' => false, 'message' => '无权访问此会话'];
        }
        
        $offset = ($page - 1) * $limit;
        
        $this->db->prepare(
            "SELECT m.id, m.sender_id, m.message_type, m.content, m.file_url, m.reply_to_message_id, 
                    m.is_read, m.created_at,
                    u.username, u.nickname, u.avatar
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.conversation_id = :conversation_id
             ORDER BY m.created_at ASC
             LIMIT :limit OFFSET :offset"
        );
        $this->db->bind(':conversation_id', $conversationId);
        $this->db->bind(':limit', $limit, PDO::PARAM_INT);
        $this->db->bind(':offset', $offset, PDO::PARAM_INT);
        
        $messages = $this->db->fetchAll();
        
        return ['success' => true, 'data' => $messages];
    }

    /**
     * 发送消息
     */
    public function sendMessage($conversationId, $senderId, $messageType, $content, $fileUrl = null, $replyToMessageId = null) {
        // 检查用户是否有权限向此会话发送消息
        $this->db->prepare(
            "SELECT COUNT(*) as count 
             FROM conversation_members 
             WHERE conversation_id = :conversation_id AND user_id = :sender_id"
        );
        $this->db->bind(':conversation_id', $conversationId);
        $this->db->bind(':sender_id', $senderId);
        $result = $this->db->fetch();
        
        if ($result['count'] == 0) {
            return ['success' => false, 'message' => '无权向此会话发送消息'];
        }
        
        // 插入消息
        $this->db->prepare(
            "INSERT INTO messages (conversation_id, sender_id, message_type, content, file_url, reply_to_message_id) 
             VALUES (:conversation_id, :sender_id, :message_type, :content, :file_url, :reply_to_message_id)"
        );
        $this->db->bind(':conversation_id', $conversationId);
        $this->db->bind(':sender_id', $senderId);
        $this->db->bind(':message_type', $messageType);
        $this->db->bind(':content', $content);
        $this->db->bind(':file_url', $fileUrl);
        $this->db->bind(':reply_to_message_id', $replyToMessageId);
        
        if ($this->db->execute()) {
            $messageId = $this->db->lastInsertId();
            
            // 更新会话的更新时间
            $this->db->prepare("UPDATE conversations SET updated_at = NOW() WHERE id = :conversation_id");
            $this->db->bind(':conversation_id', $conversationId);
            $this->db->execute();
            
            return [
                'success' => true, 
                'message' => '消息发送成功', 
                'data' => [
                    'id' => $messageId,
                    'conversation_id' => $conversationId,
                    'sender_id' => $senderId,
                    'message_type' => $messageType,
                    'content' => $content,
                    'file_url' => $fileUrl,
                    'reply_to_message_id' => $replyToMessageId,
                    'created_at' => date('Y-m-d H:i:s')
                ]
            ];
        } else {
            return ['success' => false, 'message' => '消息发送失败'];
        }
    }

    /**
     * 标记消息为已读
     */
    public function markMessageAsRead($messageIds, $userId) {
        if (empty($messageIds)) {
            return ['success' => true, 'message' => '没有需要标记的消息'];
        }
        
        // 确保消息属于用户所在的会话
        $placeholders = str_repeat('?,', count($messageIds) - 1) . '?';
        $sql = "SELECT m.id, m.conversation_id 
                FROM messages m 
                JOIN conversation_members cm ON m.conversation_id = cm.conversation_id 
                WHERE m.id IN ($placeholders) AND cm.user_id = ?";
        
        $params = array_merge($messageIds, [$userId]);
        $this->db->prepare($sql);
        $validMessages = $this->db->execute($params);
        $validMessages = $this->db->fetchAll();
        
        if (empty($validMessages)) {
            return ['success' => false, 'message' => '没有找到有效的消息'];
        }
        
        $validMessageIds = array_column($validMessages, 'id');
        
        try {
            $this->db->beginTransaction();
            
            foreach ($validMessageIds as $msgId) {
                // 检查是否已存在记录
                $this->db->prepare("SELECT id FROM message_reads WHERE message_id = :message_id AND user_id = :user_id");
                $this->db->bind(':message_id', $msgId);
                $this->db->bind(':user_id', $userId);
                $exists = $this->db->fetch();
                
                if (!$exists) {
                    // 插入已读记录
                    $this->db->prepare("INSERT INTO message_reads (message_id, user_id) VALUES (:message_id, :user_id)");
                    $this->db->bind(':message_id', $msgId);
                    $this->db->bind(':user_id', $userId);
                    $this->db->execute();
                }
            }
            
            // 更新消息的已读状态
            $msgPlaceholders = str_repeat('?,', count($validMessageIds) - 1) . '?';
            $updateSql = "UPDATE messages SET is_read = TRUE WHERE id IN ($msgPlaceholders)";
            $this->db->prepare($updateSql);
            $this->db->execute($validMessageIds);
            
            $this->db->commit();
            
            return ['success' => true, 'message' => '消息标记为已读成功'];
        } catch (Exception $e) {
            $this->db->rollback();
            return ['success' => false, 'message' => '标记消息失败: ' . $e->getMessage()];
        }
    }

    /**
     * 获取未读消息数量
     */
    public function getUnreadCount($userId) {
        $this->db->prepare(
            "SELECT COUNT(*) as unread_count
             FROM messages m
             JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
             LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = :user_id
             WHERE cm.user_id = :user_id AND m.is_read = FALSE AND mr.message_id IS NULL"
        );
        $this->db->bind(':user_id', $userId);
        $result = $this->db->fetch();
        
        return ['success' => true, 'data' => ['unread_count' => (int)$result['unread_count']]];
    }

    /**
     * 创建单聊会话（如果不存在）
     */
    public function createSingleConversation($user1Id, $user2Id) {
        // 检查是否已存在单聊会话
        $this->db->prepare(
            "SELECT c.id 
             FROM conversations c
             JOIN conversation_members cm1 ON c.id = cm1.conversation_id
             JOIN conversation_members cm2 ON c.id = cm2.conversation_id
             WHERE c.type = 'single' AND c.is_active = TRUE
               AND cm1.user_id = :user1_id AND cm2.user_id = :user2_id"
        );
        $this->db->bind(':user1_id', $user1Id);
        $this->db->bind(':user2_id', $user2Id);
        $existing = $this->db->fetch();
        
        if ($existing) {
            return ['success' => true, 'data' => ['id' => $existing['id']]];
        }
        
        // 创建新的单聊会话
        return $this->createConversation('single', null, $user1Id, [$user1Id, $user2Id]);
    }
}