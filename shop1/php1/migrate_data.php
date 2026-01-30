<?php
require_once 'config.php';
require_once 'Database.php';

// 读取JSON数据
$jsonFile = __DIR__ . '/../uniCloud-aliyan/123.json';
if (!file_exists($jsonFile)) {
    die("JSON文件不存在: $jsonFile\n");
}

$jsonContent = file_get_contents($jsonFile);
$lines = explode("\n", trim($jsonContent));

echo "开始数据迁移...\n";
echo "共 " . count($lines) . " 条数据\n\n";

$db = Database::getInstance()->getConnection();

$successCount = 0;
$failCount = 0;
$userMap = []; // 用户映射表

foreach ($lines as $index => $line) {
    if (empty(trim($line))) continue;
    
    $data = json_decode($line, true);
    if (!$data) {
        echo "第 " . ($index + 1) . " 行JSON解析失败\n";
        $failCount++;
        continue;
    }
    
    try {
        // 1. 处理用户信息
        $userId = null;
        if (!empty($data['user_mobile'])) {
            $mobile = $data['user_mobile'];
            
            // 检查用户是否已存在
            if (isset($userMap[$mobile])) {
                $userId = $userMap[$mobile];
            } else {
                $stmt = $db->prepare("SELECT id FROM users WHERE mobile = :mobile");
                $stmt->execute([':mobile' => $mobile]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($user) {
                    $userId = $user['id'];
                    $userMap[$mobile] = $userId;
                } else {
                    // 创建新用户
                    $stmt = $db->prepare("
                        INSERT INTO users (mobile, nickname, avatar_url, openid_wx, role, created_at, updated_at)
                        VALUES (:mobile, :nickname, :avatar_url, :openid_wx, :role, :created_at, :updated_at)
                    ");
                    
                    $now = isset($data['create_time']) ? $data['create_time'] : time() * 1000;
                    $role = json_encode(['user']);
                    
                    $stmt->execute([
                        ':mobile' => $mobile,
                        ':nickname' => $data['user_nickName'] ?? '用户',
                        ':avatar_url' => $data['user_avatarUrl'] ?? null,
                        ':openid_wx' => isset($data['user_id']['$oid']) ? $data['user_id']['$oid'] : null,
                        ':role' => $role,
                        ':created_at' => $now,
                        ':updated_at' => $now
                    ]);
                    
                    $userId = $db->lastInsertId();
                    $userMap[$mobile] = $userId;
                }
            }
        }
        
        if (!$userId) {
            echo "第 " . ($index + 1) . " 行：用户信息缺失\n";
            $failCount++;
            continue;
        }
        
        // 2. 插入文章数据
        $stmt = $db->prepare("
            INSERT INTO articles (
                user_id, user_nickname, user_avatar_url, user_mobile,
                content, images, video_url, address, district, cate_id,
                like_count, look_count, comment_count, state,
                enable_bargain, bargain_initial_price, bargain_step,
                bargain_mode, bargain_min_amount, bargain_max_amount,
                share_cover_image, created_at, updated_at
            ) VALUES (
                :user_id, :user_nickname, :user_avatar_url, :user_mobile,
                :content, :images, :video_url, :address, :district, :cate_id,
                :like_count, :look_count, :comment_count, :state,
                :enable_bargain, :bargain_initial_price, :bargain_step,
                :bargain_mode, :bargain_min_amount, :bargain_max_amount,
                :share_cover_image, :created_at, :updated_at
            )
        ");
        
        // 处理images字段
        $images = [];
        if (isset($data['images']) && is_array($data['images'])) {
            foreach ($data['images'] as $img) {
                $images[] = [
                    'url' => $img['url'] ?? $img['original'] ?? '',
                    'compressedURL' => $img['compressedURL'] ?? $img['compressed'] ?? '',
                    'thumbnailURL' => $img['thumbnailURL'] ?? ''
                ];
            }
        }
        $imagesJson = json_encode($images, JSON_UNESCAPED_UNICODE);
        
        // 处理video字段
        $videoUrl = null;
        if (isset($data['video']['url'])) {
            $videoUrl = $data['video']['url'];
        } elseif (isset($data['video_url']) && is_string($data['video_url'])) {
            $videoUrl = $data['video_url'];
        } elseif (isset($data['videoURL'])) {
            $videoUrl = $data['videoURL'];
        }
        
        // 处理cate_id
        $cateId = null;
        if (isset($data['cate_id']['$oid'])) {
            // 这里简单映射为null，你可以根据实际情况创建分类表映射
            $cateId = null;
        }
        
        $stmt->execute([
            ':user_id' => $userId,
            ':user_nickname' => $data['user_nickName'] ?? '',
            ':user_avatar_url' => $data['user_avatarUrl'] ?? '',
            ':user_mobile' => $data['user_mobile'] ?? '',
            ':content' => $data['content'] ?? '',
            ':images' => $imagesJson,
            ':video_url' => $videoUrl,
            ':address' => $data['address'] ?? null,
            ':district' => $data['district'] ?? null,
            ':cate_id' => $cateId,
            ':like_count' => $data['like_count'] ?? 0,
            ':look_count' => $data['look_count'] ?? 0,
            ':comment_count' => $data['comment_count'] ?? 0,
            ':state' => $data['state'] ?? 1,
            ':enable_bargain' => isset($data['enable_bargain']) ? ($data['enable_bargain'] ? 1 : 0) : 0,
            ':bargain_initial_price' => $data['bargain_initial_price'] ?? 0,
            ':bargain_step' => $data['bargain_step'] ?? 10,
            ':bargain_mode' => $data['bargain_mode'] ?? 'random',
            ':bargain_min_amount' => $data['bargain_min_amount'] ?? 1,
            ':bargain_max_amount' => $data['bargain_max_amount'] ?? 5,
            ':share_cover_image' => $data['share_cover_image'] ?? null,
            ':created_at' => $data['create_time'] ?? time() * 1000,
            ':updated_at' => $data['update_time'] ?? time() * 1000
        ]);
        
        $successCount++;
        echo "第 " . ($index + 1) . " 行：迁移成功 (ID: " . $db->lastInsertId() . ")\n";
        
    } catch (Exception $e) {
        $failCount++;
        echo "第 " . ($index + 1) . " 行：迁移失败 - " . $e->getMessage() . "\n";
    }
}

echo "\n========== 迁移完成 ==========\n";
echo "成功: $successCount 条\n";
echo "失败: $failCount 条\n";
echo "用户数: " . count($userMap) . "\n";
