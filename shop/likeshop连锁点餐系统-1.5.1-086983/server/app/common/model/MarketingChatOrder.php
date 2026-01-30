<?php
namespace app\common\model;

use app\common\basics\Models;
use app\common\enum\PayEnum;

/**
 * 营销聊天订单模型
 * Class MarketingChatOrder
 * @package app\common\model
 */
class MarketingChatOrder extends Models
{
    /**
     * 数据表名称
     * @var string
     */
    protected $name = 'marketing_chat_order';

    /**
     * 生成订单号
     * @return string
     */
    public static function generateOrderSn()
    {
        return 'MC' . date('YmdHis') . mt_rand(1000, 9999);
    }

    /**
     * 获取支付方式
     * @param bool $status
     * @return array|mixed|string
     */
    public static function getPayWay($status = true)
    {
        $desc = [
            PayEnum::WECHAT_PAY => '微信支付',
            PayEnum::ALI_PAY => '支付宝支付',
            PayEnum::BALANCE_PAY => '余额支付',
        ];
        if ($status === true) {
            return $desc;
        }
        return $desc[$status] ?? '未知';
    }

    /**
     * 获取支付状态
     * @param bool $status
     * @return array|mixed|string
     */
    public static function getPayStatus($status = true)
    {
        $desc = [
            PayEnum::NOT_PAY => '待支付',
            PayEnum::ISPAID => '已支付',
        ];
        if ($status === true) {
            return $desc;
        }
        return $desc[$status] ?? '未知';
    }

    /**
     * 支付状态获取器
     * @param $value
     * @param $data
     * @return array|mixed|string
     */
    public function getPayStatusAttr($value, $data)
    {
        return self::getPayStatus($data['pay_status']);
    }

    /**
     * 支付方式获取器
     * @param $value
     * @param $data
     * @return array|mixed|string
     */
    public function getPayWayAttr($value, $data)
    {
        return self::getPayWay($data['pay_way']);
    }

    /**
     * 支付时间获取器
     * @param $value
     * @param $data
     * @return false|string
     */
    public function getPayTimeAttr($value, $data)
    {
        if(!$data['pay_time']){
            return '';
        }
        return date('Y-m-d H:i:s', $data['pay_time']);
    }
}
