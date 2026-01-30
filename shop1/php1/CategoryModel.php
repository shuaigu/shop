<?php
require_once 'Database.php';

class CategoryModel {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * 获取所有分类
     */
    public function getCategories() {
        $sql = "SELECT * FROM categories WHERE is_visible = 1 ORDER BY sort DESC, id ASC";
        $stmt = $this->db->query($sql);
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 解析JSON字段
        foreach ($categories as &$category) {
            $category['sub_category_tags'] = json_decode($category['sub_category_tags'] ?? '[]', true);
        }
        
        return $categories;
    }
    
    /**
     * 根据ID获取分类
     */
    public function getCategoryById($id) {
        $sql = "SELECT * FROM categories WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $category = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($category) {
            $category['sub_category_tags'] = json_decode($category['sub_category_tags'] ?? '[]', true);
        }
        
        return $category;
    }
    
    /**
     * 创建分类
     */
    public function createCategory($data) {
        $sql = "INSERT INTO categories (
            cate_name, cate_img, sort, is_visible,
            is_location_based, location_district,
            sub_category_tags, sub_category_description,
            latitude, longitude, created_at, updated_at
        ) VALUES (
            :cate_name, :cate_img, :sort, :is_visible,
            :is_location_based, :location_district,
            :sub_category_tags, :sub_category_description,
            :latitude, :longitude, :created_at, :updated_at
        )";
        
        $stmt = $this->db->prepare($sql);
        
        $now = time() * 1000;
        $sub_category_tags = json_encode($data['sub_category_tags'] ?? []);
        
        return $stmt->execute([
            ':cate_name' => $data['cate_name'],
            ':cate_img' => $data['cate_img'] ?? null,
            ':sort' => $data['sort'] ?? 0,
            ':is_visible' => $data['is_visible'] ?? true,
            ':is_location_based' => $data['is_location_based'] ?? false,
            ':location_district' => $data['location_district'] ?? null,
            ':sub_category_tags' => $sub_category_tags,
            ':sub_category_description' => $data['sub_category_description'] ?? null,
            ':latitude' => $data['latitude'] ?? null,
            ':longitude' => $data['longitude'] ?? null,
            ':created_at' => $now,
            ':updated_at' => $now
        ]);
    }
}
