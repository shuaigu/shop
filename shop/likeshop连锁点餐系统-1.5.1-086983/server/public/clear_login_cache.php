<?php
/**
 * 清除登录错误次数缓存
 * 访问此文件后即可立即登录
 * 使用后请删除此文件
 */

// 禁止框架处理
define('CLEAR_CACHE_SCRIPT', true);

// 缓存目录
$cacheDir = __DIR__ . '/../runtime/cache/';

$deleted = 0;

// 递归删除包含 login_error_count 的缓存文件
function clearCacheFiles($dir, &$deleted) {
    if (!is_dir($dir)) return;
    
    $files = scandir($dir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        
        $path = $dir . $file;
        if (is_dir($path)) {
            clearCacheFiles($path . '/', $deleted);
        } else {
            // 读取文件内容检查是否包含登录错误计数
            $content = @file_get_contents($path);
            if ($content && (
                strpos($content, 'login_error_count') !== false ||
                strpos($content, 'admin_login_error') !== false ||
                strpos($content, 'shop_admin_login') !== false
            )) {
                @unlink($path);
                $deleted++;
            }
        }
    }
}

// 清除缓存
clearCacheFiles($cacheDir, $deleted);

// 同时尝试清除 tag 目录
$tagDir = __DIR__ . '/../runtime/cache/tag/';
if (is_dir($tagDir)) {
    $tagFiles = glob($tagDir . '*');
    foreach ($tagFiles as $file) {
        @unlink($file);
        $deleted++;
    }
}

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>清除登录限制</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 500px; margin: 100px auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .success { color: #52c41a; font-size: 48px; }
        h1 { color: #333; }
        p { color: #666; }
        .warning { color: #ff4d4f; font-weight: bold; }
        .btn { display: inline-block; padding: 10px 30px; background: #1890ff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="success">✓</div>
        <h1>登录限制已清除！</h1>
        <p>已清除 <?php echo $deleted; ?> 个缓存文件</p>
        <p>现在可以正常登录了</p>
        <p class="warning">请立即删除此文件！</p>
        <a href="/admin" class="btn">返回登录</a>
    </div>
</body>
</html>
