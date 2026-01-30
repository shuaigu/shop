-- =====================================================
-- 快速添加营销聊天菜单到后台（修正版）
-- =====================================================
-- 表名：ls_dev_auth
-- 只添加菜单，不添加配置
-- =====================================================

-- 删除旧菜单（如果存在）
DELETE FROM `ls_dev_auth` WHERE `name` = '营销聊天' OR `uri` = 'marketing_chat/index';

-- 添加营销聊天菜单
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
    0,                          -- 一级菜单
    '营销聊天',                  -- 菜单名称
    'marketing_chat/index',     -- 路由
    1,                          -- 菜单类型
    999,                        -- 排序（底部）
    0,                          -- 未删除
    0,                          -- 未禁用
    UNIX_TIMESTAMP(),           -- 创建时间
    UNIX_TIMESTAMP()            -- 更新时间
);

-- 查看结果
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
WHERE name = '营销聊天';

-- 完成！
SELECT '菜单添加成功！请清除缓存并重新登录查看。' as message;
