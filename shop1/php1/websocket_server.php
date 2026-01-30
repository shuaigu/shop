<?php
/**
 * WebSocket聊天服务器
 * 用于uniapp小程序实时消息推送
 */

// 设置时区
date_default_timezone_set('Asia/Shanghai');

// 定义一些常量
define('HOST', '0.0.0.0');
define('PORT', 8080);

class ChatWebSocketServer {
    private $sockets = [];           // 存储所有socket连接
    private $clients = [];           // 存储客户端信息
    private $conversations = [];     // 存储会话中的用户
    
    public function __construct() {
        echo "启动WebSocket服务器...\n";
        echo "监听地址: " . HOST . ":" . PORT . "\n";
    }
    
    /**
     * 启动服务器
     */
    public function start() {
        $socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        socket_set_option($socket, SOL_SOCKET, SO_REUSEADDR, 1);
        socket_bind($socket, HOST, PORT);
        socket_listen($socket, 20);
        
        $this->sockets[] = $socket;
        
        echo "WebSocket服务器启动成功!\n";
        
        while (true) {
            $changed = $this->sockets;
            $write = $except = null;
            
            // 监听socket变化
            $num_sockets = socket_select($changed, $write, $except, 30); // 30秒超时
            
            if ($num_sockets === false) {
                continue;
            }
            
            foreach ($changed as $sock) {
                if ($sock == $socket) {
                    // 新连接
                    $newSocket = socket_accept($socket);
                    $this->sockets[] = $newSocket;
                    
                    echo "新客户端连接: " . $this->getSocketId($newSocket) . "\n";
                } else {
                    // 数据接收
                    $data = @socket_read($sock, 2048, PHP_NORMAL_READ);
                    
                    if ($data === false) {
                        // 客户端断开连接
                        $this->disconnect($sock);
                    } else {
                        // 处理接收到的数据
                        $this->handleData($sock, $data);
                    }
                }
            }
        }
        
        socket_close($socket);
    }
    
    /**
     * 断开连接
     */
    private function disconnect($socket) {
        $socketId = $this->getSocketId($socket);
        
        if (isset($this->clients[$socketId])) {
            $userId = $this->clients[$socketId]['user_id'];
            echo "客户端断开连接: $socketId (用户ID: $userId)\n";
            
            // 从会话中移除用户
            foreach ($this->conversations as $convId => $users) {
                if (($key = array_search($userId, $users)) !== false) {
                    unset($this->conversations[$convId][$key]);
                    $this->conversations[$convId] = array_values($this->conversations[$convId]); // 重新索引
                }
            }
            
            unset($this->clients[$socketId]);
        } else {
            echo "客户端断开连接: $socketId\n";
        }
        
        $index = array_search($socket, $this->sockets);
        if ($index !== false) {
            unset($this->sockets[$index]);
        }
        
        socket_close($socket);
    }
    
    /**
     * 处理接收到的数据
     */
    private function handleData($socket, $data) {
        $decodedData = $this->unmask($data);
        
        if ($this->isHandshake($decodedData)) {
            // 握手处理
            $this->performHandshake($socket, $decodedData);
            return;
        }
        
        // 解析JSON数据
        $jsonData = json_decode($decodedData, true);
        if ($jsonData === null) {
            return;
        }
        
        $socketId = $this->getSocketId($socket);
        $action = $jsonData['action'] ?? '';
        
        switch ($action) {
            case 'login':
                $this->handleLogin($socket, $jsonData);
                break;
                
            case 'join_conversation':
                $this->handleJoinConversation($socket, $jsonData);
                break;
                
            case 'send_message':
                $this->handleSendMessage($socket, $jsonData);
                break;
                
            case 'ping':
                $this->send($socket, json_encode(['action' => 'pong']));
                break;
                
            default:
                echo "未知的操作: $action\n";
                break;
        }
    }
    
    /**
     * 判断是否为握手请求
     */
    private function isHandshake($data) {
        return strpos($data, 'GET ') === 0 && strpos($data, 'Upgrade: websocket') !== false;
    }
    
    /**
     * 执行握手
     */
    private function performHandshake($socket, $request) {
        $lines = preg_split("/\r\n/", $request);
        $key = "";
        
        foreach ($lines as $line) {
            $line = chop($line);
            if (preg_match('/Sec-WebSocket-Key: (.*)$/', $line, $matches)) {
                $key = $matches[1];
                break;
            }
        }
        
        $acceptKey = base64_encode(pack('H*', sha1($key . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')));
        
        $upgrade = "HTTP/1.1 101 Switching Protocols\r\n" .
                   "Upgrade: websocket\r\n" .
                   "Connection: Upgrade\r\n" .
                   "Sec-WebSocket-Accept: $acceptKey\r\n\r\n";
        
        socket_write($socket, $upgrade, strlen($upgrade));
    }
    
    /**
     * 处理登录
     */
    private function handleLogin($socket, $data) {
        $token = $data['token'] ?? '';
        $socketId = $this->getSocketId($socket);
        
        if (empty($token)) {
            $this->send($socket, json_encode(['action' => 'login_failed', 'message' => '缺少认证令牌']));
            return;
        }
        
        // 在实际应用中，这里应该验证JWT令牌
        // 为了示例，我们简单模拟验证
        try {
            // 这里应该引入JWT类进行验证
            // $payload = JWT::decode($token);
            // $userId = $payload['user_id'];
            
            // 模拟用户ID提取
            $userId = rand(1, 1000); // 实际应用中应从JWT解码获得
            
            $this->clients[$socketId] = [
                'socket' => $socket,
                'user_id' => $userId,
                'connected_at' => time()
            ];
            
            $response = [
                'action' => 'login_success',
                'user_id' => $userId,
                'message' => '登录成功'
            ];
            
            $this->send($socket, json_encode($response));
            echo "用户 $userId 登录成功\n";
        } catch (Exception $e) {
            $this->send($socket, json_encode(['action' => 'login_failed', 'message' => '令牌验证失败']));
        }
    }
    
    /**
     * 处理加入会话
     */
    private function handleJoinConversation($socket, $data) {
        $socketId = $this->getSocketId($socket);
        
        if (!isset($this->clients[$socketId])) {
            $this->send($socket, json_encode(['action' => 'error', 'message' => '请先登录']));
            return;
        }
        
        $conversationId = $data['conversation_id'] ?? '';
        $userId = $this->clients[$socketId]['user_id'];
        
        if (empty($conversationId)) {
            $this->send($socket, json_encode(['action' => 'error', 'message' => '会话ID不能为空']));
            return;
        }
        
        // 将用户添加到会话
        if (!isset($this->conversations[$conversationId])) {
            $this->conversations[$conversationId] = [];
        }
        
        if (!in_array($userId, $this->conversations[$conversationId])) {
            $this->conversations[$conversationId][] = $userId;
        }
        
        $response = [
            'action' => 'joined_conversation',
            'conversation_id' => $conversationId,
            'message' => '成功加入会话'
        ];
        
        $this->send($socket, json_encode($response));
        echo "用户 $userId 加入会话 $conversationId\n";
    }
    
    /**
     * 处理发送消息
     */
    private function handleSendMessage($socket, $data) {
        $socketId = $this->getSocketId($socket);
        
        if (!isset($this->clients[$socketId])) {
            $this->send($socket, json_encode(['action' => 'error', 'message' => '请先登录']));
            return;
        }
        
        $conversationId = $data['conversation_id'] ?? '';
        $content = $data['content'] ?? '';
        $messageType = $data['message_type'] ?? 'text';
        $senderId = $this->clients[$socketId]['user_id'];
        
        if (empty($conversationId) || empty($content)) {
            $this->send($socket, json_encode(['action' => 'error', 'message' => '会话ID和消息内容不能为空']));
            return;
        }
        
        // 构造消息对象
        $message = [
            'action' => 'new_message',
            'conversation_id' => $conversationId,
            'sender_id' => $senderId,
            'content' => $content,
            'message_type' => $messageType,
            'timestamp' => date('Y-m-d H:i:s'),
            'message_id' => uniqid()
        ];
        
        // 广播消息给会话中的其他用户
        $this->broadcastToConversation($conversationId, $message, $socket);
        
        echo "用户 $senderId 在会话 $conversationId 发送消息: $content\n";
    }
    
    /**
     * 广播消息给会话中的用户
     */
    private function broadcastToConversation($conversationId, $message, $excludeSocket = null) {
        if (!isset($this->conversations[$conversationId])) {
            return;
        }
        
        $excludeSocketId = $excludeSocket ? $this->getSocketId($excludeSocket) : null;
        
        foreach ($this->conversations[$conversationId] as $userId) {
            foreach ($this->clients as $socketId => $client) {
                if ($client['user_id'] == $userId && $socketId != $excludeSocketId) {
                    $this->send($client['socket'], json_encode($message));
                }
            }
        }
    }
    
    /**
     * 发送数据到socket
     */
    private function send($socket, $message) {
        $encoded = $this->mask($message);
        socket_write($socket, $encoded, strlen($encoded));
    }
    
    /**
     * 掩码数据
     */
    private function mask($text) {
        $b1 = 0x80 | (0x1 & 0x0f);
        $length = strlen($text);
        
        if ($length <= 125) {
            $header = pack('CC', $b1, $length);
        } elseif ($length <= 65535) {
            $header = pack('CCn', $b1, 126, $length);
        } else {
            $header = pack('CCNN', $b1, 127, 0, $length);
        }
        
        return $header . $text;
    }
    
    /**
     * 反掩码数据
     */
    private function unmask($data) {
        $len = ord($data[1]) & 127;
        if ($len === 126) {
            $masks = substr($data, 4, 4);
            $data = substr($data, 8);
        } elseif ($len === 127) {
            $masks = substr($data, 10, 4);
            $data = substr($data, 14);
        } else {
            $masks = substr($data, 2, 4);
            $data = substr($data, 6);
        }
        
        $text = '';
        for ($i = 0; $i < strlen($data); ++$i) {
            $text .= $data[$i] ^ $masks[$i % 4];
        }
        
        return $text;
    }
    
    /**
     * 获取socket标识符
     */
    private function getSocketId($socket) {
        return (int)$socket;
    }
}

// 启动服务器
$server = new ChatWebSocketServer();
$server->start();