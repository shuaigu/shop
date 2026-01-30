-- ================================================
-- Shop1 数据库结构（从 wx2 uniCloud 迁移）
-- ================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mobile VARCHAR(20) UNIQUE NOT NULL COMMENT '手机号',
    nickname VARCHAR(100) DEFAULT NULL COMMENT '昵称',
    avatar_url VARCHAR(500) DEFAULT NULL COMMENT '头像地址',
    gender TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女',
    status TINYINT DEFAULT 0 COMMENT '状态：0-正常，1-禁用，2-封禁',
    status_desc VARCHAR(100) DEFAULT '正常' COMMENT '状态说明',
    openid_wx VARCHAR(100) DEFAULT NULL COMMENT '微信openid',
    openid_ks VARCHAR(100) DEFAULT NULL COMMENT '快扎openid',
    openid_ds VARCHAR(100) DEFAULT NULL COMMENT '抖音openid',
    token VARCHAR(255) DEFAULT NULL COMMENT '用户token',
    session_key VARCHAR(255) DEFAULT NULL COMMENT '会话密钥',
    role JSON DEFAULT NULL COMMENT '用户角色列表',
    district VARCHAR(50) DEFAULT NULL COMMENT '用户地区',
    created_at BIGINT DEFAULT NULL COMMENT '创建时间戳',
    updated_at BIGINT DEFAULT NULL COMMENT '更新时间戳',
    INDEX idx_mobile (mobile),
    INDEX idx_openid_wx (openid_wx)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cate_name VARCHAR(20) UNIQUE NOT NULL COMMENT '分类名称',
    cate_img VARCHAR(500) DEFAULT NULL COMMENT '分类图片URL',
    sort INT DEFAULT 0 COMMENT '排序权重',
    is_visible BOOLEAN DEFAULT TRUE COMMENT '是否显示',
    is_location_based BOOLEAN DEFAULT FALSE COMMENT '是否基于位置',
    location_district VARCHAR(50) DEFAULT NULL COMMENT '对应区域',
    sub_category_tags JSON DEFAULT NULL COMMENT '二级分类标签',
    sub_category_description VARCHAR(100) DEFAULT NULL COMMENT '分类描述',
    latitude DOUBLE DEFAULT NULL COMMENT '纬度',
    longitude DOUBLE DEFAULT NULL COMMENT '经度',
    created_at BIGINT DEFAULT NULL COMMENT '创建时间戳',
    updated_at BIGINT DEFAULT NULL COMMENT '更新时间戳',
    INDEX idx_sort (sort),
    INDEX idx_cate_name (cate_name),
    INDEX idx_location_district (location_district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分类表';

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '发布者ID',
    user_nickname VARCHAR(100) DEFAULT NULL COMMENT '发布者昵称',
    user_avatar_url VARCHAR(500) DEFAULT NULL COMMENT '发布者头像',
    user_mobile VARCHAR(20) DEFAULT NULL COMMENT '发布者电话',
    content TEXT NOT NULL COMMENT '文章内容',
    images JSON DEFAULT NULL COMMENT '图片列表',
    video_url VARCHAR(500) DEFAULT NULL COMMENT '视频地址',
    address VARCHAR(200) DEFAULT NULL COMMENT '发布地址',
    district VARCHAR(50) DEFAULT NULL COMMENT '区县',
    cate_id INT DEFAULT NULL COMMENT '分类ID',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    look_count INT DEFAULT 0 COMMENT '阅读量',
    comment_count INT DEFAULT 0 COMMENT '评论数量',
    state TINYINT DEFAULT 1 COMMENT '状态：0-待审核，1-已通过，2-已拒绝',
    reject_reason VARCHAR(200) DEFAULT NULL COMMENT '拒绝原因',
    enable_bargain BOOLEAN DEFAULT FALSE COMMENT '是否启用砍价',
    bargain_initial_price DECIMAL(10,2) DEFAULT 0 COMMENT '砍价起始金额',
    bargain_step DECIMAL(10,2) DEFAULT 10 COMMENT '每次砍价金额',
    bargain_mode VARCHAR(20) DEFAULT 'random' COMMENT '砍价模式',
    bargain_min_amount DECIMAL(10,2) DEFAULT 1 COMMENT '随机模式最小金额',
    bargain_max_amount DECIMAL(10,2) DEFAULT 5 COMMENT '随机模式最大金额',
    share_cover_image VARCHAR(500) DEFAULT NULL COMMENT '分享封面图',
    created_at BIGINT NOT NULL COMMENT '创建时间戳',
    updated_at BIGINT DEFAULT NULL COMMENT '更新时间戳',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cate_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_cate_id (cate_id),
    INDEX idx_created_at (created_at),
    INDEX idx_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章表';

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL COMMENT '文章ID',
    user_id INT NOT NULL COMMENT '评论用户ID',
    content TEXT NOT NULL COMMENT '评论内容',
    parent_id INT DEFAULT NULL COMMENT '父评论ID',
    reply_to_user_id INT DEFAULT NULL COMMENT '回复的用户ID',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    created_at BIGINT NOT NULL COMMENT '创建时间戳',
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_article_id (article_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';

-- 点赞记录表
CREATE TABLE IF NOT EXISTS like_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL COMMENT '文章ID',
    user_id INT NOT NULL COMMENT '用户ID',
    created_at BIGINT NOT NULL COMMENT '创建时间戳',
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_article_user (article_id, user_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点赞记录表';

-- 浏览记录表
CREATE TABLE IF NOT EXISTS view_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL COMMENT '文章ID',
    user_id INT DEFAULT NULL COMMENT '用户ID',
    created_at BIGINT NOT NULL COMMENT '创建时间戳',
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_article_id (article_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='浏览记录表';

-- 砍价记录表
CREATE TABLE IF NOT EXISTS bargain_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL COMMENT '文章ID',
    user_id INT NOT NULL COMMENT '用户ID',
    bargain_amount DECIMAL(10,2) NOT NULL COMMENT '砍价金额',
    remaining_price DECIMAL(10,2) NOT NULL COMMENT '剩余价格',
    created_at BIGINT NOT NULL COMMENT '创建时间戳',
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_article_id (article_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='砍价记录表';