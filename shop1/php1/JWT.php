<?php
require_once 'config.php';

/**
 * JWT工具类
 */
class JWT {
    /**
     * 编码JWT
     */
    public static function encode($payload) {
        $header = json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT'
        ]);
        
        $base64Header = self::base64UrlEncode($header);
        $base64Payload = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, JWT_SECRET_KEY, true);
        $base64Signature = self::base64UrlEncode($signature);
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    /**
     * 解码JWT
     */
    public static function decode($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new Exception('无效的JWT格式');
        }
        
        list($base64Header, $base64Payload, $base64Signature) = $parts;
        
        // 验证签名
        $expectedSignature = hash_hmac('sha256', $base64Header . "." . $base64Payload, JWT_SECRET_KEY, true);
        $expectedBase64Signature = self::base64UrlEncode($expectedSignature);
        
        if (!hash_equals($base64Signature, $expectedBase64Signature)) {
            throw new Exception('JWT签名验证失败');
        }
        
        return json_decode(self::base64UrlDecode($base64Payload), true);
    }
    
    /**
     * Base64 URL编码
     */
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Base64 URL解码
     */
    private static function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
    
    /**
     * 验证JWT是否过期
     */
    public static function isExpired($token) {
        try {
            $payload = self::decode($token);
            $exp = isset($payload['exp']) ? $payload['exp'] : null;
            
            if ($exp && $exp < time()) {
                return true;
            }
            return false;
        } catch (Exception $e) {
            return true; // 如果解析失败也认为是过期的
        }
    }
}