<?php
namespace app\api\controller;

use app\api\validate\BindMobileValidate;
use app\api\validate\UserValidate;
use app\common\basics\Api;
use app\api\logic\UserLogic;
use app\common\server\JsonServer;
use app\api\validate\UpdateUserValidate;
use app\api\validate\WechatMobileValidate;
use app\api\validate\ChangeMobileValidate;

/**
 * 用户控制器
 * Class User
 * @package app\api\controller
 */
class User extends Api
{
    /***
     * 个人中心
     */
    public function center()
    {
        $config = UserLogic::center($this->user_id,$this->client);
        return JsonServer::success('', $config);
    }

    /**
     * 用户信息
     */
    public function info()
    {
        return JsonServer::success('', UserLogic::getUserInfo($this->user_id));
    }

    /**
     * Notes:设置用户信息
     */
    public function setInfo()
    {
        $post = $this->request->post();
        $post['user_id'] = $this->user_id;
        (new UpdateUserValidate())->goCheck('set', $post);
        UserLogic::setUserInfo($post,$this->user_id);
        return JsonServer::success('设置成功');
    }

    /**
     * Notes:获取微信手机号
     */
    public function getMobile()
    {
        $post = $this->request->post();
        (new WechatMobileValidate())->goCheck($post);
        $result = UserLogic::getMobileByMnp($post);
        if($result === false) {
            return JsonServer::error(UserLogic::getError());
        }
        return JsonServer::success('', $result);
    }

    /**
     * Notes: 更换手机号
     * @author 段誉(2021/6/23)
     * @return \think\response\Json
     */
    public function changeMobile()
    {
        $data = $this->request->post();
        $data['user_id'] = $this->user_id;
        //变更手机号码
        (new ChangeMobileValidate())->goCheck('', $data);
        $result = UserLogic::changeMobile($this->user_id, $data);
        return JsonServer::success('操作成功',$result);
    }

    /**
     * @notes 绑定手机号码
     * @return \think\response\Json
     * @author cjhao
     * @date 2023/10/18 11:19
     */
    public function bindMobile()
    {
        $post = $this->request->post();
        $post['user_id'] = $this->user_id;
        //变更手机号码
        (new BindMobileValidate())->goCheck('', $post);
        UserLogic::bindMobile($this->user_id, $post);
        return JsonServer::success('操作成功');
    }

    /**
     * 余额明细
     */
    public function balanceDetails(){
        // 来源类型 0-全部 1-消费 2-充值
        $source = $this->request->get('source');
        (new UserValidate())->goCheck('balanceDetails');
        $data = UserLogic::balanceDetails($this->user_id, $source, $this->page_no, $this->page_size);
        return JsonServer::success('', $data);
    }

    /**
     * @notes 商家打款测试（微信支付 V3 接口）
     */
    public function transferTest()
    {
        $amount = $this->request->post('amount', 0);
        if ($amount <= 0) {
            return JsonServer::error('金额必须大于0');
        }
        
        try {
            $user_auth = \think\facade\Db::name('user_auth')
                ->where(['user_id' => $this->user_id, 'client' => \app\common\model\Client_::mnp])
                ->find();
            
            if (!$user_auth || empty($user_auth['openid'])) {
                return JsonServer::error('未找到小程序授权信息');
            }

            // ========================================
            // !!!  请在下方填写您的 V3 接口参数  !!!
            // ========================================
            
            // 1. 商户号
            $mchId = '1545803671';
            
            // 2. 小程序 AppID
            $appId = 'wxf7ee79349bd957b8';
            
            // 3. APIV3 密钥（32位字符串，在商户平台-账户中心-API安全中设置）
            // 示例：'abcdef1234567890abcdef1234567890'
            $apiV3Key = 'YOUR_API_V3_KEY_32_CHARACTERS_HERE';
            
            // 4. 证书文件路径（证书文件夹的绝对路径）
            // 本地测试路径
            // $certPath = 'c:/Users/10205/Pictures/1545803671_20250301_cert';
            
            // 服务器路径（证书文件已上传到 controller 目录）
            $certPath = __DIR__;
            
            // ========================================
            //    填写 apiV3Key 后，保存文件即可测试
            // ========================================

            // 检查参数是否已填写
            if ($apiV3Key === 'lishuai4323811lishuai4323811lish') {
                return JsonServer::error('请先在 User.php 的 transferTest 方法中填写 APIV3 密钥（第150行）');
            }
            
            // 自动读取证书文件
            $privateKeyPath = $certPath . '/apiclient_key.pem';
            $certFilePath = $certPath . '/apiclient_cert.pem';
            
            if (!file_exists($privateKeyPath)) {
                return JsonServer::error("私钥文件不存在: $privateKeyPath");
            }
            if (!file_exists($certFilePath)) {
                return JsonServer::error("证书文件不存在: $certFilePath");
            }
            
            // 证书序列号（从商户平台获取）
            $certSerialNo = '7282272EC446E827251B9FBAC2757DE1897026D3';

            // V3 接口地址
            $url = 'https://api.mch.weixin.qq.com/v3/transfer/batches';
            $outBatchNo = 'BATCH' . date('YmdHis') . rand(1000, 9999);
            
            // 构造请求数据
            $data = [
                'appid' => $appId,
                'out_batch_no' => $outBatchNo,
                'batch_name' => '商家打款测试',
                'batch_remark' => '商家打款测试',
                'total_amount' => (int)($amount * 100),
                'total_num' => 1,
                'transfer_detail_list' => [
                    [
                        'out_detail_no' => 'DETAIL' . date('YmdHis') . rand(1000, 9999),
                        'transfer_amount' => (int)($amount * 100),
                        'transfer_remark' => '商家打款测试',
                        'openid' => $user_auth['openid'],
                    ]
                ]
            ];

            $jsonBody = json_encode($data, JSON_UNESCAPED_UNICODE);
            $timestamp = time();
            $nonce = strtoupper(bin2hex(random_bytes(16)));
            $method = 'POST';
            $apiUrl = '/v3/transfer/batches';
            
            // 构造签名串
            $message = "$method\n$apiUrl\n$timestamp\n$nonce\n$jsonBody\n";
            
            // 加载私钥进行签名
            $privateKeyContent = file_get_contents($privateKeyPath);
            $privateKey = openssl_get_privatekey($privateKeyContent);
            if (!$privateKey) {
                return JsonServer::error('私钥加载失败，请检查私钥文件格式是否正确');
            }
            
            openssl_sign($message, $signature, $privateKey, 'sha256WithRSAEncryption');
            $sign = base64_encode($signature);
            
            // 构造 Authorization 头
            $authorization = sprintf(
                'WECHATPAY2-SHA256-RSA2048 mchid="%s",nonce_str="%s",signature="%s",timestamp="%d",serial_no="%s"',
                $mchId,
                $nonce,
                $sign,
                $timestamp,
                $certSerialNo
            );

            // 发起 HTTP 请求
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonBody);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: $authorization",
                "Content-Type: application/json",
                "Accept: application/json",
                "User-Agent: Likeshop-Transfer-Test"
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($curlError) {
                return JsonServer::error('网络请求失败：' . $curlError);
            }

            $result = json_decode($response, true);
            
            if ($httpCode == 200 || $httpCode == 202) {
                return JsonServer::success('转账批次已提交成功！', [
                    'http_code' => $httpCode,
                    'out_batch_no' => $outBatchNo,
                    'result' => $result
                ]);
            } else {
                return JsonServer::error(
                    'V3转账失败 (HTTP ' . $httpCode . ')', 
                    [
                        'http_code' => $httpCode,
                        'error_msg' => $result['message'] ?? '未知错误',
                        'error_code' => $result['code'] ?? '',
                        'detail' => $result
                    ]
                );
            }

        } catch (\Exception $e) {
            return JsonServer::error('异常：' . $e->getMessage());
        }
    }

}
