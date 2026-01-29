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
     * @notes 商家打款测试
     */
    public function transferTest()
    {
        $amount = $this->request->post('amount', 0);
        if ($amount <= 0) {
            return JsonServer::error('金额必须大于0');
        }
        
        // 调用商家打款逻辑（此处需要根据实际项目中的 WeChatPayServer 或类似服务实现）
        // 这是一个示例实现，具体取决于你的 EasyWeChat 版本和配置
        try {
            $user_auth = \think\facade\Db::name('user_auth')
                ->where(['user_id' => $this->user_id, 'client' => \app\common\model\Client_::mnp])
                ->find();
            
            if (!$user_auth || empty($user_auth['openid'])) {
                return JsonServer::error('未找到小程序授权信息');
            }

            $config = \app\common\server\WeChatServer::getPayConfig(\app\common\model\Client_::mnp);
            $app = \EasyWeChat\Factory::payment($config);

            $partner_trade_no = 'TEST' . date('YmdHis') . rand(1000, 9999);
            
            // 注意：这里使用的是旧版企业付款到零钱接口，如果是新版商家转账到零钱，接口名不同
            // 如果是新版商家转账到零钱，请参考 EasyWeChat 文档
            $result = $app->transfer->toBalance([
                'partner_trade_no' => $partner_trade_no,
                'openid' => $user_auth['openid'],
                'check_name' => 'NO_CHECK',
                'amount' => $amount * 100, // 分
                'desc' => '商家打款测试',
            ]);

            if ($result['return_code'] == 'SUCCESS' && $result['result_code'] == 'SUCCESS') {
                return JsonServer::success('打款成功', $result);
            } else {
                return JsonServer::error('打款失败：' . ($result['err_code_des'] ?? $result['return_msg'] ?? '未知错误'), $result);
            }
        } catch (\Exception $e) {
            return JsonServer::error('异常：' . $e->getMessage());
        }
    }

}