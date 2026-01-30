<?php
/**
 * 测试营销聊天支付接口
 * 访问: http://你的域名/test_pay.php
 */

// 显示所有错误
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>测试支付接口</title>";
echo "<style>body{font-family:Arial;padding:20px;background:#f5f5f5;}";
echo ".result{background:white;padding:20px;border-radius:8px;margin:10px 0;}";
echo "h2{color:#333;border-bottom:2px solid #1989fa;padding-bottom:10px;}";
echo "pre{background:#272822;color:#f8f8f2;padding:15px;border-radius:4px;overflow-x:auto;}";
echo ".error{background:#fff2e8;border-left:4px solid #ff4d4f;}";
echo ".success{background:#f6ffed;border-left:4px solid #52c41a;}";
echo "</style></head><body>";

echo "<h1>🔧 测试营销聊天支付接口</h1>";

// 测试1: 检查数据库表是否存在
echo "<div class='result'><h2>1. 检查数据库表</h2>";
try {
    // 读取.env文件获取数据库配置
    $envFile = dirname(__DIR__) . '/.env';
    if (file_exists($envFile)) {
        $envContent = file_get_contents($envFile);
        preg_match('/DATABASE_HOST\s*=\s*(.+)/', $envContent, $hostMatch);
        preg_match('/DATABASE_NAME\s*=\s*(.+)/', $envContent, $nameMatch);
        preg_match('/DATABASE_USER\s*=\s*(.+)/', $envContent, $userMatch);
        preg_match('/DATABASE_PASS\s*=\s*(.*)/', $envContent, $passMatch);
        preg_match('/DATABASE_PREFIX\s*=\s*(.+)/', $envContent, $prefixMatch);
        
        $host = trim($hostMatch[1] ?? 'localhost');
        $dbname = trim($nameMatch[1] ?? '');
        $user = trim($userMatch[1] ?? 'root');
        $pass = trim($passMatch[1] ?? '');
        $prefix = trim($prefixMatch[1] ?? 'la_');
        
        if (empty($dbname)) {
            echo "<div class='error'>❌ 无法从.env文件读取数据库配置</div>";
        } else {
            $pdo = new PDO(
                "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
                $user,
                $pass
            );
            
            $tableName = $prefix . 'marketing_chat_order';
            $stmt = $pdo->query("SHOW TABLES LIKE '$tableName'");
            $tableExists = $stmt->rowCount() > 0;
            
            if ($tableExists) {
                echo "<div class='success'>";
                echo "✅ 数据库表 <strong>$tableName</strong> 存在<br>";
                
                // 查看表结构
                $stmt = $pdo->query("DESCRIBE `$tableName`");
                $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo "<h3>表结构：</h3>";
                echo "<pre>";
                foreach ($columns as $col) {
                    echo "{$col['Field']} - {$col['Type']}\n";
                }
                echo "</pre>";
                echo "</div>";
            } else {
                echo "<div class='error'>❌ 数据库表 <strong>$tableName</strong> 不存在！</div>";
            }
        }
    } else {
        echo "<div class='error'>❌ .env文件不存在: $envFile</div>";
    }
    
} catch (Exception $e) {
    echo "<div class='error'>❌ 数据库测试失败: " . $e->getMessage() . "</div>";
}
echo "</div>";

// 测试2: 检查模型文件是否存在
echo "<div class='result'><h2>2. 检查模型文件</h2>";
$modelPath = dirname(__DIR__) . '/app/common/model/MarketingChatOrder.php';
if (file_exists($modelPath)) {
    echo "<div class='success'>✅ 模型文件存在</div>";
    echo "<pre>路径: $modelPath</pre>";
} else {
    echo "<div class='error'>❌ 模型文件不存在！</div>";
    echo "<pre>期望路径: $modelPath</pre>";
}
echo "</div>";

// 测试3: 测试接口调用
echo "<div class='result'><h2>3. 测试API接口</h2>";
echo "<p>请在浏览器控制台或邮递员(Postman)中测试以下接口：</p>";
echo "<pre>";
echo "POST " . $_SERVER['REQUEST_SCHEME'] . "://" . $_SERVER['HTTP_HOST'] . "/api/pay/createMarketingChatOrder\n\n";
echo "Headers:\n";
echo "Content-Type: application/json\n";
echo "token: (在小程序控制台执行 uni.getStorageSync('token') 获取)\n\n";
echo "Body:\n";
echo json_encode([
    'amount' => 0.4,
    'remark' => '营销聊天诚意金（测试）'
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
echo "</pre>";
echo "</div>";

// 测试4: 检查.env配置
echo "<div class='result'><h2>4. 检查环境配置</h2>";
$envFile = dirname(__DIR__) . '/.env';
if (file_exists($envFile)) {
    echo "<div class='success'>✅ .env文件存在</div>";
    echo "<h3>数据库配置：</h3>";
    $envContent = file_get_contents($envFile);
    $lines = explode("\n", $envContent);
    echo "<pre>";
    foreach ($lines as $line) {
        if (strpos($line, 'DATABASE_') === 0) {
            // 隐藏密码
            if (strpos($line, 'DATABASE_PASS') === 0) {
                echo "DATABASE_PASS = ******\n";
            } else {
                echo htmlspecialchars($line) . "\n";
            }
        }
    }
    echo "</pre>";
} else {
    echo "<div class='error'>❌ .env文件不存在！</div>";
}
echo "</div>";

// 测试5: PHP环境信息
echo "<div class='result'><h2>5. PHP环境信息</h2>";
echo "<pre>";
echo "PHP版本: " . PHP_VERSION . "\n";
echo "PDO支持: " . (extension_loaded('pdo') ? '是' : '否') . "\n";
echo "PDO MySQL支持: " . (extension_loaded('pdo_mysql') ? '是' : '否') . "\n";
echo "</pre>";
echo "</div>";

echo "</body></html>";
