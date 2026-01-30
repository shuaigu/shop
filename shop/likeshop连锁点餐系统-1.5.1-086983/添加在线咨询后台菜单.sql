-- =====================================================
-- 添加"在线咨询"后台管理菜单
-- =====================================================
-- 说明：在后台管理左侧菜单添加"在线咨询"入口
-- 对标小程序端个人中心的"在线咨询"功能
-- =====================================================

-- 第一步：查看现有菜单结构（了解系统）
-- 如果表名是 la_auth，使用这个：
SELECT id, pid, name, uri, sort FROM `la_auth` 
WHERE pid = 0 
ORDER BY sort DESC 
LIMIT 10;

-- 如果表名是 ls_dev_auth，使用这个：
-- SELECT id, pid, name, uri, sort FROM `ls_dev_auth` 
-- WHERE pid = 0 
-- ORDER BY sort DESC 
-- LIMIT 10;

-- =====================================================
-- 第二步：添加"在线咨询"菜单
-- =====================================================
-- 注意：根据你的实际表名选择执行（la_auth 或 ls_dev_auth）

-- 方案A：如果表名是 la_auth（推荐先试这个）
-- 删除旧菜单（如果存在）
DELETE FROM `la_auth` WHERE `name` = '在线咨询' OR `uri` = 'marketing_chat/index';

-- 添加新菜单
INSERT INTO `la_auth` (
    `pid`, 
    `name`, 
    `uri`, 
    `type`, 
    `sort`, 
    `is_show`, 
    `icon`,
    `create_time`, 
    `update_time`
) VALUES (
    0,                          -- pid=0 表示一级菜单
    '在线咨询',                  -- 菜单名称
    'marketing_chat/index',     -- 路由地址（对应后台控制器）
    1,                          -- type=1 表示菜单
    850,                        -- 排序（在"个人"菜单后面，可根据实际调整）
    1,                          -- is_show=1 显示
    'el-icon-chat-dot-square',  -- 图标
    UNIX_TIMESTAMP(),           -- 创建时间
    UNIX_TIMESTAMP()            -- 更新时间
);

-- 查看添加结果
SELECT id, pid, name, uri, sort, is_show 
FROM `la_auth` 
WHERE name = '在线咨询';

-- =====================================================
-- 方案B：如果表名是 ls_dev_auth（如果方案A报错，用这个）
-- =====================================================

-- 删除旧菜单（如果存在）
-- DELETE FROM `ls_dev_auth` WHERE `name` = '在线咨询' OR `uri` = 'marketing_chat/index';

-- 添加新菜单
-- INSERT INTO `ls_dev_auth` (
--     `pid`, 
--     `name`, 
--     `uri`, 
--     `type`, 
--     `sort`, 
--     `del`,
--     `disable`,
--     `create_time`, 
--     `update_time`
-- ) VALUES (
--     0,                          -- pid=0 表示一级菜单
--     '在线咨询',                  -- 菜单名称
--     'marketing_chat/index',     -- 路由地址
--     1,                          -- type=1 表示菜单
--     850,                        -- 排序
--     0,                          -- del=0 未删除
--     0,                          -- disable=0 未禁用
--     UNIX_TIMESTAMP(),           -- 创建时间
--     UNIX_TIMESTAMP()            -- 更新时间
-- );

-- 查看添加结果
-- SELECT id, pid, name, uri, sort, del, disable
-- FROM `ls_dev_auth` 
-- WHERE name = '在线咨询';

-- =====================================================
-- 第三步：给管理员角色添加权限（可选）
-- =====================================================

-- 获取刚添加的菜单ID
SET @menu_id = (SELECT id FROM `la_auth` WHERE name = '在线咨询' AND pid = 0 LIMIT 1);

-- 如果系统有角色权限表，给管理员（ID=1）添加权限
-- INSERT INTO `la_role_auth` (`role_id`, `auth_id`) VALUES (1, @menu_id);

-- =====================================================
-- 第四步：查看所有一级菜单（验证位置）
-- =====================================================

SELECT id, name, uri, sort, is_show 
FROM `la_auth` 
WHERE pid = 0 
ORDER BY sort;

-- =====================================================
-- 调整菜单位置（如果位置不合适）
-- =====================================================

-- 查看"个人"菜单的排序值
-- SELECT id, name, sort FROM `la_auth` WHERE name LIKE '%个人%' AND pid = 0;

-- 如果要放在"个人"菜单后面，将sort设置为比"个人"大的值
-- 例如：如果"个人"的sort是800，设置为810
-- UPDATE `la_auth` SET sort = 810 WHERE name = '在线咨询' AND pid = 0;

-- =====================================================
-- 删除菜单（如果添加错误，使用此命令删除重来）
-- =====================================================

-- DELETE FROM `la_auth` WHERE name = '在线咨询';

-- =====================================================
-- 完成！
-- =====================================================
-- 
-- ✅ 执行后的操作步骤：
-- 
-- 1. 清除后台缓存
--    方式1：在后台找到 "系统" → "系统缓存" → "清除缓存"
--    方式2：执行 SQL：TRUNCATE TABLE `la_cache`;（如果有这个表）
-- 
-- 2. 退出后台并重新登录
-- 
-- 3. 查看左侧菜单，应该能看到"在线咨询"菜单
-- 
-- 4. 点击菜单，打开配置页面
-- 
-- 5. 配置页面功能：
--    - 设置横幅标题和副标题
--    - 上传客服头像
--    - 配置对话流程（可视化编辑或JSON编辑）
--    - 保存配置后，小程序端的"在线咨询"会自动更新
-- 
-- 🔍 验证是否成功：
-- 
-- 数据库验证：
SELECT 
    id,
    pid,
    name,
    uri,
    sort,
    is_show,
    FROM_UNIXTIME(create_time) as created_at
FROM `la_auth` 
WHERE name = '在线咨询';

-- 应该返回一条记录
-- 
-- ❓ 常见问题：
-- 
-- Q1: 添加后看不到菜单
-- A: 清除缓存并重新登录，确保 is_show=1
-- 
-- Q2: 点击菜单显示404
-- A: 检查文件 server/app/admin/controller/MarketingChat.php 是否存在
-- 
-- Q3: 菜单位置不对
-- A: 调整 sort 值，数字越大越靠后
-- 
-- Q4: 没有权限访问
-- A: 执行上面的权限添加SQL，或在后台权限管理中手动添加
-- 
-- =====================================================
