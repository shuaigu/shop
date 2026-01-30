-- =====================================================
-- 营销聊天页面配置 - 快速导入SQL
-- =====================================================
-- 使用说明：
-- 1. 根据你的实际表前缀修改表名（默认为 la_）
-- 2. 执行此SQL导入默认配置
-- 3. 之后可以在后台管理界面修改
-- =====================================================

-- 删除旧配置（如果存在）
DELETE FROM `la_config` WHERE `type` = 'marketing_chat';

-- 插入营销聊天配置

-- 1. 聊天流程配置
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
]', '营销聊天对话流程配置');

-- 2. 顶部横幅标题
INSERT INTO `la_config` (`type`, `name`, `value`, `describe`) VALUES 
('marketing_chat', 'banner_title', '我们帮您把业务/产品推广出去', '营销聊天页面横幅标题');

-- 3. 顶部横幅副标题
INSERT INTO `la_config` (`type`, `name`, `value`, `describe`) VALUES 
('marketing_chat', 'banner_subtitle', '您只需要等着客户主动找上门', '营销聊天页面横幅副标题');

-- 4. 底部备案信息
INSERT INTO `la_config` (`type`, `name`, `value`, `describe`) VALUES 
('marketing_chat', 'footer_text', '页面信息及服务由湖北客聚多企业管理有限公司提供', '营销聊天页面底部备案信息');

-- 5. 客服头像（默认使用网络图片，可以上传后修改）
INSERT INTO `la_config` (`type`, `name`, `value`, `describe`) VALUES 
('marketing_chat', 'service_avatar', 'https://img.yzcdn.cn/vant/cat.jpeg', '营销聊天客服头像');

-- =====================================================
-- 配置完成！
-- =====================================================

-- 查看已插入的配置
SELECT * FROM `la_config` WHERE `type` = 'marketing_chat';

-- =====================================================
-- 修改示例
-- =====================================================

-- 示例1: 修改横幅标题
-- UPDATE `la_config` SET `value` = '您的新标题' WHERE `type` = 'marketing_chat' AND `name` = 'banner_title';

-- 示例2: 修改底部信息
-- UPDATE `la_config` SET `value` = '您的公司名称' WHERE `type` = 'marketing_chat' AND `name` = 'footer_text';

-- 示例3: 上传客服头像后更新路径
-- UPDATE `la_config` SET `value` = '/uploads/images/service_avatar.png' WHERE `type` = 'marketing_chat' AND `name` = 'service_avatar';

-- =====================================================
-- 简单对话流程示例
-- =====================================================

-- 如果你想创建一个更简单的对话流程，可以这样修改：
/*
UPDATE `la_config` SET `value` = '[
  {
    "type": "service",
    "content": "您好！欢迎咨询我们的服务",
    "delay": 500
  },
  {
    "type": "service",
    "content": "请问您需要什么帮助？",
    "delay": 800,
    "waitForResponse": true,
    "responseKey": "helpType",
    "buttons": [
      {"text": "产品咨询", "value": "product"},
      {"text": "价格咨询", "value": "price"},
      {"text": "其他问题", "value": "other"}
    ]
  },
  {
    "type": "service",
    "content": "感谢咨询！我们的客服将尽快与您联系。",
    "delay": 800
  }
]' WHERE `type` = 'marketing_chat' AND `name` = 'chat_flow';
*/
