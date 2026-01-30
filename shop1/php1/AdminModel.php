<?php
require_once 'Database.php';

/**
 * 管理员模型类
 */
class AdminModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * 获取所有用户列表
     */
    public function getAllUsers($page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        
        // 获取总数
        $this->db->prepare("SELECT COUNT(*) as total FROM users");
        $total = $this->db->fetch()['total'];

        // 获取列表
        $this->db->prepare(
            "SELECT id, username, nickname, avatar, email, phone, status, role, created_at, last_login_at 
             FROM users 
             ORDER BY created_at DESC 
             LIMIT :offset, :limit"
        );
        $this->db->bind(':offset', $offset, PDO::PARAM_INT);
        $this->db->bind(':limit', $limit, PDO::PARAM_INT);
        $users = $this->db->fetchAll();

        return [
            'success' => true, 
            'data' => [
                'list' => $users,
                'total' => $total,
                'page' => $page,
                'limit' => $limit
            ]
        ];
    }

    /**
     * 更新用户状态（禁用/启用）
     */
    public function updateUserStatus($userId, $status) {
        $this->db->prepare("UPDATE users SET status = :status WHERE id = :id");
        $this->db->bind(':status', $status);
        $this->db->bind(':id', $userId);

        if ($this->db->execute()) {
            return ['success' => true, 'message' => '用户状态更新成功'];
        } else {
            return ['success' => false, 'message' => '用户状态更新失败'];
        }
    }

    /**
     * 获取系统统计信息
     */
    public function getStatistics() {
        $stats = [];

        // 用户总数
        $this->db->prepare("SELECT COUNT(*) as count FROM users");
        $stats['total_users'] = $this->db->fetch()['count'];

        // 会话总数
        $this->db->prepare("SELECT COUNT(*) as count FROM conversations");
        $stats['total_conversations'] = $this->db->fetch()['count'];

        // 消息总数
        $this->db->prepare("SELECT COUNT(*) as count FROM messages");
        $stats['total_messages'] = $this->db->fetch()['count'];

        // 今日新增用户
        $this->db->prepare("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()");
        $stats['new_users_today'] = $this->db->fetch()['count'];

        // 今日消息数
        $this->db->prepare("SELECT COUNT(*) as count FROM messages WHERE DATE(created_at) = CURDATE()");
        $stats['messages_today'] = $this->db->fetch()['count'];

        return ['success' => true, 'data' => $stats];
    }

    /**
     * 获取所有消息记录（用于审计）
     */
    public function getAllMessages($page = 1, $limit = 50) {
        $offset = ($page - 1) * $limit;

        $this->db->prepare("SELECT COUNT(*) as total FROM messages");
        $total = $this->db->fetch()['total'];

        $this->db->prepare(
            "SELECT m.*, u.username as sender_name, u.nickname as sender_nickname 
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             ORDER BY m.created_at DESC 
             LIMIT :offset, :limit"
        );
        $this->db->bind(':offset', $offset, PDO::PARAM_INT);
        $this->db->bind(':limit', $limit, PDO::PARAM_INT);
        $messages = $this->db->fetchAll();

        return [
            'success' => true, 
            'data' => [
                'list' => $messages,
                'total' => $total
            ]
        ];
    }
}
