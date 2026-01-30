-- =====================================================
-- 营销聊天功能 - 一键完整部署
-- =====================================================
-- 本脚本包含：
-- 1. 数据库配置（对话流程、横幅等）
-- 2. 后台菜单（在左侧底部显示）
-- 3. 权限配置（管理员可访问）
-- =====================================================
-- 使用方法：
-- 1. 根据你的表前缀修改表名（默认 la_）
-- 2. 在数据库工具中执行整个脚本
-- 3. 清除后台缓存
-- 4. 重新登录后台查看
-- =====================================================

-- =====================================================
-- 第一部分：删除旧配置（如果存在）
-- =====================================================

-- 删除旧的营销聊天配置
DELETE FROM `la_config` WHERE `type` = 'marketing_chat';

-- 删除旧的菜单
DELETE FROM `la_auth` WHERE `name` = '营销聊天' OR `uri` = 'marketing_chat/index';

-- =====================================================
-- 第二部分：添加营销聊天配置
-- =====================================================

-- 1. 对话流程配置
INSERT INTO `la_config` (`type`, `name`, `value`, `describe`) VALUES 
('marketing_chat', 'chat_flow', '[
  {
    "type": "service",
    "content": "我们是做全行业获客的专业团队，能够帮助您精准获取客户；意向客户会主动添加您，全行业均可做；若您有需求，请认真回答以下问题。",
    "delay": 500
  },
  {
    "type": "service",
    "content": "您是否整面临获客难、成本高的问题？",
    "delay": 1000,
    "waitForResponse": true,
    "responseKey": "hasCustomerProblem",
    "buttons": [
      {"text": "是", "value": true},
      {"text": "否", "value": false}
    ]
  },
  {
    "type": "service",
    "content": "您想要获取哪里的客户？",
    "delay": 800,
    "waitForResponse": true,
    "responseKey": "customerLocation",
    "buttons": [
      {"text": "本地客户", "value": "local"},
      {"text": "全国客户", "value": "national"}
    ]
  },
  {
    "type": "service",
    "content": "我们提供精准客户，您是否接受1000-3000/年的合作费用？",
    "delay": 800,
    "waitForResponse": true,
    "responseKey": "acceptPrice",
    "buttons": [
      {"text": "是", "value": true, "type": "primary"},
      {"text": "否", "value": false, "type": "warning"}
    ]
  },
  {
    "type": "service",
    "content": "太棒了！请留下您的联系方式，我们的专业顾问将在24小时内与您联系。",
    "delay": 800,
    "condition": {"key": "acceptPrice", "value": true}
  },
  {
    "type": "service",
    "content": "感谢您的关注！如果以后有需要，随时欢迎咨询我们。",
    "delay": 800,
    "condition": {"key": "acceptPrice", "value": false}
  }
]', '营销聊天对话流程');

-- 2. 横幅标题
INSERT INTO `la_config` (`type`, `name`, `value`, `describe`) VALUES 
('marketing_chat', 'banner_title', '我们帮您把业务/产品推广出去', '横幅标题');

-- 3. 横幅副标题
INSERT INTO `la_config` (`type`, `name`, `value`, `describe`) VALUES 
('marketing_chat', 'banner_subtitle', '您只需要等着客户主动找上门', '横幅副标题');

-- 4. 底部信息
INSERT INTO `la_config` (`type`, `name`, `value`, `describe`) VALUES 
('marketing_chat', 'footer_text', '页面信息及服务由湖北客聚多企业管理有限公司提供', '底部信息');

-- 5. 客服头像
INSERT INTO `la_config` (`type`, `name`, `value`, `describe`) VALUES 
('marketing_chat', 'service_avatar', 'https://img.yzcdn.cn/vant/cat.jpeg', '客服头像');

-- =====================================================
-- 第三部分：添加后台菜单
-- =====================================================

-- 添加营销聊天菜单（一级菜单，显示在底部）
INSERT INTO `la_auth` (
    `pid`, 
    `name`, 
    `uri`, 
    `type`, 
    `sort`, 
    `is_show`, 
    `create_time`, 
    `update_time`
) VALUES (
    0,                          -- pid=0 表示一级菜单
    '营销聊天',                  -- 菜单名称
    'marketing_chat/index',     -- 路由地址
    1,                          -- type=1 表示菜单
    999,                        -- sort=999 显示在最下方
    1,                          -- is_show=1 显示
    UNIX_TIMESTAMP(),           -- 创建时间
    UNIX_TIMESTAMP()            -- 更新时间
);

-- 获取刚添加的菜单ID
SET @menu_id = LAST_INSERT_ID();

-- =====================================================
-- 第四部分：配置权限（可选）
-- =====================================================

-- 给管理员角色（ID=1）添加权限
-- 如果系统有角色权限表，取消下面的注释
-- INSERT INTO `la_role_auth` (`role_id`, `auth_id`) VALUES (1, @menu_id);

-- =====================================================
-- 第五部分：验证结果
-- =====================================================

-- 查看配置是否添加成功
SELECT '=== 营销聊天配置 ===' as title;
SELECT type, name, SUBSTRING(value, 1, 50) as value_preview, `describe` 
FROM `la_config` 
WHERE `type` = 'marketing_chat';

-- 查看菜单是否添加成功
SELECT '=== 后台菜单 ===' as title;
SELECT 
    id,
    pid,
    name,
    uri,
    type,
    sort,
    is_show,
    FROM_UNIXTIME(create_time) as created_at
FROM `la_auth` 
WHERE name = '营销聊天';

-- =====================================================
-- 部署完成提示
-- =====================================================
SELECT '✅ 部署完成！' as message;
SELECT '请按以下步骤操作：' as step;
SELECT '1. 清除后台缓存（系统→系统缓存→清除缓存）' as step_1;
SELECT '2. 退出后台管理系统' as step_2;
SELECT '3. 重新登录后台' as step_3;
SELECT '4. 在左侧菜单底部找到"营销聊天"菜单' as step_4;
SELECT '5. 点击打开配置页面进行设置' as step_5;
SELECT '6. 前端访问：/pages/marketing_chat/marketing_chat' as step_6;

-- =====================================================
-- 如果需要删除（回滚）
-- =====================================================
-- 取消下面的注释来删除所有配置
/*
DELETE FROM `la_config` WHERE `type` = 'marketing_chat';
DELETE FROM `la_auth` WHERE `name` = '营销聊天';
-- DELETE FROM `la_role_auth` WHERE `auth_id` = @menu_id;
SELECT '已删除所有营销聊天配置' as message;
*/

-- =====================================================
-- 注意事项
-- =====================================================
-- 1. 如果表前缀不是 la_，请全局替换
-- 2. 某些系统可能没有 la_role_auth 表，可以忽略权限配置
-- 3. 字段名可能不同，请根据实际表结构调整
-- 4. 执行后必须清除缓存才能生效
-- =====================================================
