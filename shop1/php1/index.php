<?php
/**
 * 聊天系统后端 - 入口文件
 * 
 * 为uniapp小程序提供聊天功能的PHP后端
 * 
 * 功能特性:
 * - 用户注册/登录
 * - 一对一/群组聊天
 * - 消息历史记录
 * - 实时消息推送
 * - 未读消息统计
 * 
 * API端点:
 * - /api.php - 主要API接口
 * - /realtime_polling.php - 实时通信轮询接口
 * 
 * WebSocket服务:
 * - websocket_server.php - WebSocket实时通信服务
 */

// 显示系统信息
echo "<h1>聊天系统后端</h1>";
echo "<p>这是一个为uniapp小程序设计的聊天系统后端。</p>";

echo "<h2>系统组件</h2>";
echo "<ul>";
echo "<li><strong>API接口</strong>: <a href='api.php'>api.php</a></li>";
echo "<li><strong>实时通信</strong>: <a href='realtime_polling.php'>realtime_polling.php</a></li>";
echo "<li><strong>测试界面</strong>: <a href='test_api.php'>test_api.php</a></li>";
echo "</ul>";

echo "<h2>API文档</h2>";
echo "<p>详细API文档请查看: <a href='API_DOCUMENTATION.md'>API_DOCUMENTATION.md</a></p>";

echo "<h2>数据库初始化</h2>";
echo "<p>要初始化数据库，请执行: <code>database_schema.sql</code> 文件中的SQL语句</p>";

echo "<h2>WebSocket服务</h2>";
echo "<p>如需使用WebSocket实时通信，请运行: <code>websocket_server.php</code></p>";
echo "<pre>php websocket_server.php</pre>";

echo "<h2>系统要求</h2>";
echo "<ul>";
echo "<li>PHP 7.0+</li>";
echo "<li>MySQL 5.7+</li>";
echo "<li>PDO扩展</li>";
echo "</ul>";
?>