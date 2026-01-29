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

namespace app\shop\controller;


use app\common\basics\ShopBase;
use app\common\server\ConfigServer;
use app\common\server\JsonServer;
use app\shop\logic\ShopSettingLogic;

class ShopSetting extends ShopBase
{
    /**
     * @notes 店铺设置
     * @return \think\response\Json|\think\response\View
     * @author ljj
     * @date 2024/1/31 11:40 上午
     */
    public function setting()
    {
        if($this->request->isAjax()){
            $post = $this->request->post();
            ShopSettingLogic::set($post,$this->shop_id);
            return JsonServer::success('设置成功');
        }
        return view('store/setting', [
            'config'  => ShopSettingLogic::get($this->shop_id),
            'qq_map_key' => ConfigServer::get('map', 'qq_map_key', '')
        ]);
    }
}