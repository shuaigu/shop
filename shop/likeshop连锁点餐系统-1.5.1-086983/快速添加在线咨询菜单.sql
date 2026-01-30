-- =====================================================
-- 快速添加"在线咨询"后台菜单（简化版）
-- =====================================================
-- 直接复制下面的SQL到数据库执行即可
-- =====================================================

-- 第1步：删除旧菜单（如果存在）
DELETE FROM `ls_dev_auth` WHERE `name` = '在线咨询' OR `uri` = 'marketing_chat/index';

-- 第2步：添加"在线咨询"菜单
INSERT INTO `ls_dev_auth` (
    `pid`, 
    `name`, 
    `uri`, 
    `type`, 
    `sort`, 
    `del`, 
    `disable`,
    `create_time`, 
    `update_time`
) VALUES (
    0,
    '在线咨询',
    'marketing_chat/index',
    1,
    850,
    0,
    0,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
);

-- 第3步：查看添加结果
SELECT 
    id,
    pid,
    name,
    uri,
    sort,
    del,
    disable,
    FROM_UNIXTIME(create_time) as created_at
FROM `ls_dev_auth` 
WHERE name = '在线咨询';

-- =====================================================
-- 完成！接下来请：
-- 1. 在后台找到"系统" → "清除缓存"
-- 2. 退出后台重新登录
-- 3. 查看左侧菜单是否出现"在线咨询"
-- =====================================================
