-- =============================================
-- 营销聊天订单表创建脚本
-- 表名前缀：ls_ （根据你的实际数据库配置）
-- 执行此脚本创建营销聊天订单表
-- =============================================

-- 创建营销聊天订单表
CREATE TABLE IF NOT EXISTS `ls_marketing_chat_order` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_sn` varchar(64) NOT NULL DEFAULT '' COMMENT '订单编号',
  `user_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '用户ID',
  `order_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '订单金额',
  `pay_way` tinyint(1) NOT NULL DEFAULT '0' COMMENT '支付方式：1-微信支付，2-支付宝支付，3-余额支付',
  `pay_status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '支付状态：0-未支付，1-已支付',
  `pay_time` int(11) NOT NULL DEFAULT '0' COMMENT '支付时间',
  `transaction_id` varchar(128) NOT NULL DEFAULT '' COMMENT '第三方平台交易流水号',
  `remark` varchar(255) NOT NULL DEFAULT '' COMMENT '备注',
  `create_time` int(11) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(11) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(11) DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `order_sn` (`order_sn`),
  KEY `user_id` (`user_id`),
  KEY `pay_status` (`pay_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='营销聊天订单表';

-- 验证表是否创建成功
SELECT '✓ 表创建成功！' AS message, COUNT(*) AS row_count FROM `ls_marketing_chat_order`;
