<?php
/**
 * 重置管理员密码脚本
 * 使用后请立即删除此文件！
 */

// 设置新密码（你可以修改这里）
$new_password = '123456';
$account = 'lishuai';

// 生成盐值
$salt = 'ab12';

// 密码加密函数（与系统一致）
function generatePassword($plaintext, $salt) {
    $salt = md5('y' . $salt . 'x');
    $salt .= '2021';
    return md5($plaintext . $salt);
}

// 计算加密后的密码
$encrypted_password = generatePassword($new_password, $salt);

// 数据库配置（从 .env 读取或手动配置）
$env_file = __DIR__ . '/../.env';
$db_config = [];

if (file_exists($env_file)) {
    $env_content = file_get_contents($env_file);
    preg_match('/DB_HOST\s*=\s*(.+)/', $env_content, $m);
    $db_config['host'] = trim($m[1] ?? 'localhost');
    preg_match('/DB_NAME\s*=\s*(.+)/', $env_content, $m);
    $db_config['name'] = trim($m[1] ?? 'shop');
    preg_match('/DB_USER\s*=\s*(.+)/', $env_content, $m);
    $db_config['user'] = trim($m[1] ?? 'root');
    preg_match('/DB_PASS\s*=\s*(.+)/', $env_content, $m);
    $db_config['pass'] = trim($m[1] ?? '');
    preg_match('/DB_PREFIX\s*=\s*(.+)/', $env_content, $m);
    $db_config['prefix'] = trim($m[1] ?? 'ls_');
}

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>重置管理员密码</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .info { background: #e6f7ff; border: 1px solid #91d5ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .success { background: #f6ffed; border: 1px solid #b7eb8f; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .error { background: #fff2f0; border: 1px solid #ffccc7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fffbe6; border: 1px solid #ffe58f; padding: 15px; border-radius: 5px; margin: 20px 0; color: #d48806; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
        .btn { display: inline-block; padding: 10px 30px; background: #1890ff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        td:first-child { font-weight: bold; width: 40%; }
    </style>
</head>
<body>
<div class="container">
    <h1>重置管理员密码</h1>
    
    <div class="info">
        <strong>将要设置的信息：</strong>
        <table>
            <tr><td>账号</td><td><code><?php echo htmlspecialchars($account); ?></code></td></tr>
            <tr><td>新密码</td><td><code><?php echo htmlspecialchars($new_password); ?></code></td></tr>
            <tr><td>盐值</td><td><code><?php echo htmlspecialchars($salt); ?></code></td></tr>
            <tr><td>加密后密码</td><td><code><?php echo $encrypted_password; ?></code></td></tr>
        </table>
    </div>

<?php
$updated = false;
$error_msg = '';

if (!empty($db_config['host'])) {
    try {
        $pdo = new PDO(
            "mysql:host={$db_config['host']};dbname={$db_config['name']};charset=utf8mb4",
            $db_config['user'],
            $db_config['pass']
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $table = $db_config['prefix'] . 'admin';
        $stmt = $pdo->prepare("UPDATE `{$table}` SET `password` = ?, `salt` = ?, `disable` = 0 WHERE `account` = ?");
        $result = $stmt->execute([$encrypted_password, $salt, $account]);
        
        if ($stmt->rowCount() > 0) {
            $updated = true;
        } else {
            $error_msg = "未找到账号 '{$account}'，或密码未更改";
        }
    } catch (PDOException $e) {
        $error_msg = $e->getMessage();
    }
}

if ($updated): ?>
    <div class="success">
        <strong>✓ 密码重置成功！</strong><br><br>
        现在可以使用以下信息登录：<br>
        账号：<code><?php echo htmlspecialchars($account); ?></code><br>
        密码：<code><?php echo htmlspecialchars($new_password); ?></code>
    </div>
<?php elseif ($error_msg): ?>
    <div class="error">
        <strong>✗ 重置失败：</strong><?php echo htmlspecialchars($error_msg); ?>
    </div>
<?php endif; ?>

    <div class="warning">
        <strong>⚠ 安全警告：</strong>请在登录成功后立即删除此文件！
    </div>
    
    <div class="info">
        <strong>如果自动更新失败，请手动执行以下 SQL：</strong><br><br>
        <code style="display:block; padding:10px; background:#f0f0f0; word-break:break-all;">
UPDATE `ls_admin` SET `password` = '<?php echo $encrypted_password; ?>', `salt` = '<?php echo $salt; ?>', `disable` = 0 WHERE `account` = '<?php echo $account; ?>';
        </code>
    </div>
    
    <center><a href="/admin" class="btn">去登录</a></center>
</div>
</body>
</html>
