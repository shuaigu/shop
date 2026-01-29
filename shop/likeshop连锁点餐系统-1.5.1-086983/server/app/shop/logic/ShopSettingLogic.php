<?php
// +----------------------------------------------------------------------
// | likeshop开源商城系统
// +----------------------------------------------------------------------
// | 欢迎阅读学习系统程序代码，建议反馈是我们前进的动力
// | gitee下载：https://gitee.com/likeshop_gitee
// | github下载：https://github.com/likeshop-github
// | 访问官网：https://www.likeshop.cn
// | 访问社区：https://home.likeshop.cn
// | 访问手册：http://doc.likeshop.cn
// | 微信公众号：likeshop技术社区
// | likeshop系列产品在gitee、github等公开渠道开源版本可免费商用，未经许可不能去除前后端官方版权标识
// |  likeshop系列产品收费版本务必购买商业授权，购买去版权授权后，方可去除前后端官方版权标识
// | 禁止对系统程序代码以任何目的，任何形式的再发布
// | likeshop团队版权所有并拥有最终解释权
// +----------------------------------------------------------------------
// | author: likeshop.cn.team
// +----------------------------------------------------------------------

namespace app\shop\logic;


use app\common\model\shop\Shop;
use app\common\server\UrlServer;

class ShopSettingLogic
{
    /**
     * @notes 获取
     * @param $shop_id
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     * @author ljj
     * @date 2024/1/31 2:38 下午
     */
    public static function get($shop_id){
        $detail = Shop::where(['id'=>$shop_id,'del'=>0])
            ->append(['province_name','city_name','district_name'])
            ->json(['license'],true)
            ->find()
            ->toArray();
        if (is_array($detail['license']) && !empty($detail['license'])) {
            foreach ($detail['license'] as &$license) {
                $license = UrlServer::getFileUrl($license);
            }
        }
        $detail['weekdays'] = explode(',',$detail['weekdays']);
        $detail['delivery_type'] = explode(',',$detail['delivery_type']);
        $detail['full_address'] = $detail['province_name'].$detail['city_name'].$detail['district_name'].$detail['address'];
        return $detail;
    }

    /**
     * @notes 设置
     * @param $post
     * @param $shop_id
     * @return Shop
     * @author ljj
     * @date 2024/1/31 2:38 下午
     */
    public static function set($post,$shop_id)
    {
        $license = [];
        if (isset($post['license']) && !empty($post['license']) && is_array($post['license'])) {
            foreach ($post['license'] as $value) {
                $license[] = UrlServer::setFileUrl($value);
            }
        }
        $data = [
            'status' => $post['status'],
            'update_time' => time(),
            'license' => json_encode($license, JSON_UNESCAPED_UNICODE)
        ];
        return Shop::update($data,['id'=>$shop_id]);
    }
}