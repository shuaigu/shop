<?php

namespace app\api\controller;
use app\api\
{
    logic\PayLogic,
    validate\UnifiedpayVlidate
};
use app\common\{
    basics\Api,
    model\Client_,
    model\MarketingChatOrder,
    server\JsonServer,
    server\WeChatServer,
    server\AliPayServer,
    server\WeChatPayServer
};

/**
 * Class Pay
 * @package app\api\controller
 */
class Pay extends Api
{
    public $like_not_need_login = ['notifyMnp', 'notifyOa', 'notifyApp', 'aliNotify'];


    /**
     * @notes 获取支付方式
     * @return \think\response\Json
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     * @author cjhao
     * @date 2021/10/11 9:49
     */
    public function getPayWay()
    {
        $params = $this->request->get();
        if(!isset($params['from']) || !isset($params['order_id'])) {
            return JsonServer::error('参数缺失');
        }
        $pay_way = PayLogic::getPayWay($this->user_id, $this->client, $params);
        return JsonServer::success('', $pay_way);

    }
    /**
     * @notes 支付入口
     * @return \think\response\Json
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     * @author suny
     * @date 2021/7/13 6:13 下午
     */
    public function unifiedpay()
    {
        $post = (new UnifiedpayVlidate())->goCheck();
        $res = PayLogic::unifiedPay($post,$this->client);
        if(false === $res){
            return JsonServer::error(PayLogic::getError());
        }
        return JsonServer::success('',$res);

    }

    /**
     * @notes 小程序回调
     * @throws \EasyWeChat\Kernel\Exceptions\Exception
     * @author suny
     * @date 2021/7/13 6:13 下午
     */
    public function notifyMnp()
    {
        $config = WeChatServer::getPayConfig(Client_::mnp);
        return WeChatPayServer::notify($config);
    }


    /**
     * @notes 公众号回调
     * @throws \EasyWeChat\Kernel\Exceptions\Exception
     * @author suny
     * @date 2021/7/13 6:13 下午
     */
    public function notifyOa()
    {

        $config = WeChatServer::getPayConfig(Client_::oa);
        return WeChatPayServer::notify($config);
    }


    /**
     * @notes APP回调
     * @throws \EasyWeChat\Kernel\Exceptions\Exception
     * @author suny
     * @date 2021/7/13 6:14 下午
     */
    public function notifyApp()
    {

        $config = WeChatServer::getPayConfig(Client_::ios);
        return WeChatPayServer::notify($config);
    }

    /**
     * @notes 商家打款测试
     * @return \think\response\Json
     */
    public function testTransfer()
    {
        $amount = $this->request->post('amount');
        if (!$amount || $amount <= 0) {
            return JsonServer::error('请输入正确的金额');
        }
        $res = PayLogic::testTransfer($this->user_id, $amount);
        if (false === $res) {
            return JsonServer::error(PayLogic::getError());
        }
        return JsonServer::success('打款成功', $res);
    }


    /**
     * @notes 支付宝回调
     * @return bool
     * @author suny
     * @date 2021/7/13 6:14 下午
     */
    public function aliNotify()
    {

        $data = $this->request->post();
        return (new AliPayServer())->verifyNotify($data);
    }

    /**
     * @notes 创建营销聊天订单
     * @return \think\response\Json
     * @throws \think\db\exception\DbException
     */
    public function createMarketingChatOrder()
    {
        $amount = $this->request->post('amount', 0);
        $remark = $this->request->post('remark', '营销聊天诚意金');
        
        // 验证金额
        if (!$amount || $amount <= 0) {
            return JsonServer::error('请输入正确的金额');
        }

        // 验证用户登录
        if (!$this->user_id) {
            return JsonServer::error('用户未登录，请先登录');
        }

        try {
            // 创建订单
            $order = new MarketingChatOrder();
            $order->order_sn = MarketingChatOrder::generateOrderSn();
            $order->user_id = $this->user_id;
            $order->order_amount = $amount;
            $order->pay_status = 0; // 未支付
            $order->remark = $remark;
            $order->create_time = time();
            $order->update_time = time();
            $order->save();

            return JsonServer::success('订单创建成功', [
                'order_id' => $order->id,
                'order_sn' => $order->order_sn,
                'order_amount' => $order->order_amount
            ]);
        } catch (\Exception $e) {
            // 返回详细错误信息（开发环境）
            $errorMsg = '创建订单失败';
            // if (config('app.app_debug')) {
            //     $errorMsg .= ': ' . $e->getMessage();
            // }
            $errorMsg .= ': ' . $e->getMessage(); // 临时显示详细错误
            return JsonServer::error($errorMsg);
        }
    }
}