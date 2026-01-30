<?php
require_once 'config.php';

/**
 * 数据库操作类
 */
class Database {
    private $connection;
    private $statement;
    private static $instance = null;

    private function __construct() {
        $this->connect();
    }
    
    /**
     * 获取单例实例
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * 获取数据库连接
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * 连接数据库
     */
    private function connect() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            $this->sendError("数据库连接失败: " . $e->getMessage());
        }
    }

    /**
     * 准备SQL语句
     */
    public function prepare($sql) {
        try {
            $this->statement = $this->connection->prepare($sql);
            return $this;
        } catch (PDOException $e) {
            $this->sendError("SQL准备失败: " . $e->getMessage());
        }
    }

    /**
     * 绑定参数
     */
    public function bind($param, $value, $type = null) {
        if (is_null($type)) {
            switch (true) {
                case is_int($value):
                    $type = PDO::PARAM_INT;
                    break;
                case is_bool($value):
                    $type = PDO::PARAM_BOOL;
                    break;
                case is_null($value):
                    $type = PDO::PARAM_NULL;
                    break;
                default:
                    $type = PDO::PARAM_STR;
                    break;
            }
        }
        
        $this->statement->bindValue($param, $value, $type);
        return $this;
    }

    /**
     * 执行SQL
     */
    public function execute($params = []) {
        try {
            if (!empty($params)) {
                return $this->statement->execute($params);
            }
            return $this->statement->execute();
        } catch (PDOException $e) {
            $this->sendError("SQL执行失败: " . $e->getMessage());
        }
    }

    /**
     * 获取单行结果
     */
    public function fetch() {
        return $this->statement->fetch();
    }

    /**
     * 获取多行结果
     */
    public function fetchAll() {
        return $this->statement->fetchAll();
    }

    /**
     * 获取影响行数
     */
    public function rowCount() {
        return $this->statement->rowCount();
    }

    /**
     * 获取最后插入ID
     */
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }

    /**
     * 开始事务
     */
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }

    /**
     * 提交事务
     */
    public function commit() {
        return $this->connection->commit();
    }

    /**
     * 回滚事务
     */
    public function rollback() {
        return $this->connection->rollback();
    }

    /**
     * 发送错误信息
     */
    private function sendError($message) {
        if (DEBUG_MODE) {
            echo json_encode(['success' => false, 'message' => $message, 'data' => null]);
        } else {
            echo json_encode(['success' => false, 'message' => '服务器内部错误', 'data' => null]);
        }
        exit;
    }
}