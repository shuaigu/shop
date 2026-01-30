<?php
require_once 'Database.php';
require_once 'JWT.php';

/**
 * 用户模型类
 */
class UserModel {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * 注册用户
     */
    public function register($username, $password, $nickname = null, $email = null, $phone = null) {
        // 检查用户名是否已存在
        $this->db->prepare("SELECT id FROM users WHERE username = :username");
        $this->db->bind(':username', $username);
        $result = $this->db->fetch();

        if ($result) {
            return ['success' => false, 'message' => '用户名已存在'];
        }

        // 明文密码（临时调试）
        $passwordHash = $password;

        // 插入新用户
        $this->db->prepare(
            "INSERT INTO users (username, password_hash, nickname, email, phone) 
             VALUES (:username, :password_hash, :nickname, :email, :phone)"
        );
        $this->db->bind(':username', $username);
        $this->db->bind(':password_hash', $passwordHash);
        $this->db->bind(':nickname', $nickname);
        $this->db->bind(':email', $email);
        $this->db->bind(':phone', $phone);

        if ($this->db->execute()) {
            $userId = $this->db->lastInsertId();
            return ['success' => true, 'message' => '注册成功', 'data' => ['id' => $userId]];
        } else {
            return ['success' => false, 'message' => '注册失败'];
        }
    }

    /**
     * 用户登录
     */
    public function login($username, $password) {
        $this->db->prepare("SELECT id, username, password_hash, nickname, avatar, status FROM users WHERE username = :username");
        $this->db->bind(':username', $username);
        $user = $this->db->fetch();

        if (!$user) {
            return ['success' => false, 'message' => '用户名或密码错误'];
        }

        if ($user['status'] == 0) {
            return ['success' => false, 'message' => '账户已被禁用'];
        }

        // 明文密码比对（临时调试）
        if ($password === $user['password_hash']) {
            // 更新最后登录时间
            $this->db->prepare("UPDATE users SET last_login_at = NOW() WHERE id = :id");
            $this->db->bind(':id', $user['id']);
            $this->db->execute();

            // 生成JWT令牌
            $payload = [
                'user_id' => $user['id'],
                'username' => $user['username'],
                'nickname' => $user['nickname'],
                'exp' => time() + (7 * 24 * 60 * 60) // 7天过期
            ];

            $token = JWT::encode($payload);

            return [
                'success' => true, 
                'message' => '登录成功', 
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'nickname' => $user['nickname'],
                        'avatar' => $user['avatar']
                    ]
                ]
            ];
        } else {
            return ['success' => false, 'message' => '用户名或密码错误'];
        }
    }

    /**
     * 微信小程序登录（code2session方式）
     */
    public function wxLogin($code) {
        // 处理开发环境的 mock code
        if (DEBUG_MODE && (strpos($code, 'mock') !== false || $code === 'the code is a mock one')) {
            // 开发环境下使用测试数据
            $openid = 'test_openid_' . md5($code);
            $session_key = 'test_session_key_' . time();
            
            // 查找或创建测试用户
            $stmt = $this->db->prepare("SELECT id, mobile, nickname, avatar_url, status, role FROM users WHERE openid_wx = :openid");
            $stmt->execute([':openid' => $openid]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                // 创建测试用户
                $stmt = $this->db->prepare(
                    "INSERT INTO users (mobile, openid_wx, session_key, role, nickname, avatar_url, created_at, updated_at) 
                     VALUES (:mobile, :openid, :session_key, :role, :nickname, :avatar_url, :created_at, :updated_at)"
                );
                
                $now = time() * 1000;
                $role = json_encode(['user']);
                $mobile = '138' . rand(10000000, 99999999);
                $nickname = '测试用户' . rand(1000, 9999);
                $avatar_url = '/static/images/touxiang.png';
                
                $stmt->execute([
                    ':mobile' => $mobile,
                    ':openid' => $openid,
                    ':session_key' => $session_key,
                    ':role' => $role,
                    ':nickname' => $nickname,
                    ':avatar_url' => $avatar_url,
                    ':created_at' => $now,
                    ':updated_at' => $now
                ]);
                
                $userId = $this->db->lastInsertId();
                $user = [
                    'id' => $userId,
                    'mobile' => $mobile,
                    'nickname' => $nickname,
                    'avatar_url' => $avatar_url,
                    'status' => 0,
                    'role' => ['user']
                ];
            }
            
            // 生成token
            $payload = [
                'user_id' => $user['id'],
                'mobile' => $user['mobile'],
                'nickname' => $user['nickname'],
                'exp' => time() + (7 * 24 * 60 * 60)
            ];
            
            $token = JWT::encode($payload);
            
            // 更新token
            $stmt = $this->db->prepare("UPDATE users SET token = :token WHERE id = :id");
            $stmt->execute([':token' => $token, ':id' => $user['id']]);
            
            return [
                'success' => true,
                'message' => '登录成功（测试模式）',
                'data' => [
                    'token' => $token,
                    'hasCompleteInfo' => true,
                    'userInfo' => [
                        '_id' => (string)$user['id'],
                        'nickName' => $user['nickname'],
                        'avatarUrl' => $user['avatar_url'],
                        'mobile' => $user['mobile'],
                        'openid' => $openid,
                        'role' => json_decode($user['role'] ?? '["user"]', true)
                    ]
                ]
            ];
        }
        
        // 1. 调用微信接口换取openid和session_key
        $appid = WX_APPID;
        $secret = WX_SECRET;
        $url = "https://api.weixin.qq.com/sns/jscode2session?appid={$appid}&secret={$secret}&js_code={$code}&grant_type=authorization_code";
        
        // 使用 curl 请求微信 API
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // 开发环境可以关闭 SSL 验证
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($response === false) {
            return [
                'success' => false, 
                'message' => '请求微信API失败: ' . $curlError
            ];
        }
        
        $data = json_decode($response, true);
        
        // 记录日志用于调试
        if (DEBUG_MODE) {
            error_log("微信登录响应: " . json_encode($data));
        }
        
        if (!isset($data['openid'])) {
            $errorMsg = $data['errmsg'] ?? '未知错误';
            $errorCode = $data['errcode'] ?? 'unknown';
            return [
                'success' => false, 
                'message' => "获取openid失败: {$errorMsg} (code: {$errorCode})",
                'error' => $errorMsg
            ];
        }
        
        $openid = $data['openid'];
        $session_key = $data['session_key'] ?? '';
        
        // 2. 检查用户是否已存在
        $stmt = $this->db->prepare("SELECT id, mobile, nickname, avatar_url, status, role FROM users WHERE openid_wx = :openid");
        $stmt->execute([':openid' => $openid]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            // 用户已存在
            if ($user['status'] != 0) {
                return ['success' => false, 'message' => '账户已被禁用或封禁'];
            }
            
            // 更新session_key
            $stmt = $this->db->prepare("UPDATE users SET session_key = :session_key WHERE id = :id");
            $stmt->execute([':session_key' => $session_key, ':id' => $user['id']]);
        } else {
            // 新用户，创建记录（手机号为空，需要后续授权）
            $stmt = $this->db->prepare(
                "INSERT INTO users (mobile, openid_wx, session_key, role, created_at, updated_at) 
                 VALUES (:mobile, :openid, :session_key, :role, :created_at, :updated_at)"
            );
            
            $now = time() * 1000;
            $role = json_encode(['user']);
            $mobile = 'temp_' . substr(md5($openid), 0, 10); // 临时手机号
            
            $stmt->execute([
                ':mobile' => $mobile,
                ':openid' => $openid,
                ':session_key' => $session_key,
                ':role' => $role,
                ':created_at' => $now,
                ':updated_at' => $now
            ]);
            
            $userId = $this->db->lastInsertId();
            $user = [
                'id' => $userId,
                'mobile' => $mobile,
                'nickname' => null,
                'avatar_url' => null,
                'status' => 0,
                'role' => ['user']
            ];
        }
        
        // 3. 生成token
        $payload = [
            'user_id' => $user['id'],
            'mobile' => $user['mobile'],
            'nickname' => $user['nickname'],
            'exp' => time() + (7 * 24 * 60 * 60)
        ];
        
        $token = JWT::encode($payload);
        
        // 4. 更新token
        $stmt = $this->db->prepare("UPDATE users SET token = :token WHERE id = :id");
        $stmt->execute([':token' => $token, ':id' => $user['id']]);
        
        return [
            'success' => true,
            'message' => '登录成功',
            'data' => [
                'token' => $token,
                'hasCompleteInfo' => !empty($user['nickname']) && !empty($user['mobile']) && !str_starts_with($user['mobile'], 'temp_'),
                'userInfo' => [
                    '_id' => (string)$user['id'],
                    'nickName' => $user['nickname'],
                    'avatarUrl' => $user['avatar_url'],
                    'mobile' => $user['mobile'],
                    'openid' => $openid,  // 返回openid用于支付
                    'role' => json_decode($user['role'] ?? '["user"]', true)
                ]
            ]
        ];
    }

    /**
     * 获取用户信息
     */
    public function getUserById($userId) {
        $this->db->prepare("SELECT id, username, nickname, avatar, email, phone, created_at FROM users WHERE id = :id AND status = 1");
        $this->db->bind(':id', $userId);
        $user = $this->db->fetch();

        if ($user) {
            return ['success' => true, 'data' => $user];
        } else {
            return ['success' => false, 'message' => '用户不存在'];
        }
    }

    /**
     * 根据用户名搜索用户（用于添加好友或查找用户）
     */
    public function searchUsersByUsername($username, $limit = 10) {
        $this->db->prepare(
            "SELECT id, username, nickname, avatar FROM users 
             WHERE username LIKE :username AND status = 1 
             ORDER BY created_at DESC LIMIT :limit"
        );
        $this->db->bind(':username', '%' . $username . '%');
        $this->db->bind(':limit', $limit, PDO::PARAM_INT);
        $users = $this->db->fetchAll();

        return ['success' => true, 'data' => $users];
    }

    /**
     * 更新用户信息
     */
    public function updateUser($userId, $updateData) {
        // 构建动态更新语句
        $allowedFields = ['nickname', 'avatar', 'email', 'phone'];
        $setParts = [];
        $params = [];

        foreach ($updateData as $field => $value) {
            if (in_array($field, $allowedFields)) {
                $setParts[] = "$field = :$field";
                $params[$field] = $value;
            }
        }

        if (empty($setParts)) {
            return ['success' => false, 'message' => '没有有效的字段可以更新'];
        }

        $setClause = implode(', ', $setParts);
        $sql = "UPDATE users SET $setClause, updated_at = NOW() WHERE id = :userId";

        $this->db->prepare($sql);
        foreach ($params as $field => $value) {
            $this->db->bind(":$field", $value);
        }
        $this->db->bind(':userId', $userId);

        if ($this->db->execute()) {
            return ['success' => true, 'message' => '用户信息更新成功'];
        } else {
            return ['success' => false, 'message' => '用户信息更新失败'];
        }
    }

    /**
     * 修改密码
     */
    public function changePassword($userId, $oldPassword, $newPassword) {
        // 首先验证旧密码
        $this->db->prepare("SELECT password_hash FROM users WHERE id = :id");
        $this->db->bind(':id', $userId);
        $result = $this->db->fetch();

        if (!$result || !password_verify($oldPassword, $result['password_hash'])) {
            return ['success' => false, 'message' => '原密码不正确'];
        }

        // 更新密码
        $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $this->db->prepare("UPDATE users SET password_hash = :password_hash WHERE id = :id");
        $this->db->bind(':password_hash', $newPasswordHash);
        $this->db->bind(':id', $userId);

        if ($this->db->execute()) {
            return ['success' => true, 'message' => '密码修改成功'];
        } else {
            return ['success' => false, 'message' => '密码修改失败'];
        }
    }
}