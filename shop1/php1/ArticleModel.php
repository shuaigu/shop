<?php
require_once 'Database.php';

class ArticleModel {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * 获取文章列表
     */
    public function getArticles($cate_id = '', $page = 1, $pageSize = 10) {
        $offset = ($page - 1) * $pageSize;
        
        $sql = "SELECT a.*, u.nickname as user_nickname, u.avatar_url as user_avatar_url 
                FROM articles a 
                LEFT JOIN users u ON a.user_id = u.id 
                WHERE a.state = 1";
        
        if ($cate_id) {
            $sql .= " AND a.cate_id = :cate_id";
        }
        
        $sql .= " ORDER BY a.created_at DESC LIMIT :offset, :pageSize";
        
        $stmt = $this->db->prepare($sql);
        if ($cate_id) {
            $stmt->bindValue(':cate_id', $cate_id, PDO::PARAM_INT);
        }
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':pageSize', $pageSize, PDO::PARAM_INT);
        $stmt->execute();
        
        $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 解析JSON字段
        foreach ($articles as &$article) {
            $article['images'] = json_decode($article['images'] ?? '[]', true);
            $article['role'] = json_decode($article['role'] ?? '["user"]', true);
        }
        
        return $articles;
    }
    
    /**
     * 获取文章详情
     */
    public function getArticleById($id) {
        $sql = "SELECT a.*, u.nickname as user_nickname, u.avatar_url as user_avatar_url 
                FROM articles a 
                LEFT JOIN users u ON a.user_id = u.id 
                WHERE a.id = :id";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $article = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($article) {
            $article['images'] = json_decode($article['images'] ?? '[]', true);
        }
        
        return $article;
    }
    
    /**
     * 创建文章
     */
    public function createArticle($data) {
        $sql = "INSERT INTO articles (
            user_id, user_nickname, user_avatar_url, user_mobile,
            content, images, video_url, address, district, cate_id,
            like_count, look_count, comment_count, state,
            enable_bargain, bargain_initial_price, bargain_step,
            bargain_mode, bargain_min_amount, bargain_max_amount,
            share_cover_image, created_at, updated_at
        ) VALUES (
            :user_id, :user_nickname, :user_avatar_url, :user_mobile,
            :content, :images, :video_url, :address, :district, :cate_id,
            0, 0, 0, 1,
            :enable_bargain, :bargain_initial_price, :bargain_step,
            :bargain_mode, :bargain_min_amount, :bargain_max_amount,
            :share_cover_image, :created_at, :updated_at
        )";
        
        $stmt = $this->db->prepare($sql);
        
        $now = time() * 1000; // 毫秒时间戳
        $images = json_encode($data['images'] ?? []);
        
        return $stmt->execute([
            ':user_id' => $data['user_id'],
            ':user_nickname' => $data['user_nickname'] ?? '',
            ':user_avatar_url' => $data['user_avatar_url'] ?? '',
            ':user_mobile' => $data['user_mobile'] ?? '',
            ':content' => $data['content'],
            ':images' => $images,
            ':video_url' => $data['video_url'] ?? null,
            ':address' => $data['address'] ?? null,
            ':district' => $data['district'] ?? null,
            ':cate_id' => $data['cate_id'] ?? null,
            ':enable_bargain' => $data['enable_bargain'] ?? false,
            ':bargain_initial_price' => $data['bargain_initial_price'] ?? 0,
            ':bargain_step' => $data['bargain_step'] ?? 10,
            ':bargain_mode' => $data['bargain_mode'] ?? 'random',
            ':bargain_min_amount' => $data['bargain_min_amount'] ?? 1,
            ':bargain_max_amount' => $data['bargain_max_amount'] ?? 5,
            ':share_cover_image' => $data['share_cover_image'] ?? null,
            ':created_at' => $now,
            ':updated_at' => $now
        ]);
    }
    
    /**
     * 删除文章
     */
    public function deleteArticle($id, $user_id) {
        $sql = "DELETE FROM articles WHERE id = :id AND user_id = :user_id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $id, ':user_id' => $user_id]);
    }
    
    /**
     * 增加浏览量
     */
    public function incrementViewCount($id) {
        $sql = "UPDATE articles SET look_count = look_count + 1 WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $id]);
    }
}
