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
use app\common\server\JsonServer;
use app\shop\logic\DeskLogic;
use app\shop\validate\DeskValidate;

class Desk extends ShopBase
{
    /**
     * @notes 桌号列表
     * @return \think\response\Json|\think\response\View
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     * @author ljj
     * @date 2024/1/31 4:54 下午
     */
    public function lists()
    {
        if ($this->request->isAjax()) {
            $get = $this->request->get();
            return JsonServer::success('', DeskLogic::lists($get,$this->shop_id));
        }

        return view('');
    }

    /**
     * @notes 新增桌号
     * @return \think\response\Json|\think\response\View
     * @author ljj
     * @date 2024/1/31 5:00 下午
     */
    public function add()
    {
        if($this->request->isAjax()){
            $post = (new DeskValidate())->goCheck('add',['shop_id'=>$this->shop_id]);
            DeskLogic::add($post);
            return JsonServer::success('操作成功');
        }

        return view('');
    }

    /**
     * @notes 批量新增桌号
     * @return \think\response\Json|\think\response\View
     * @author ljj
     * @date 2024/1/31 6:39 下午
     */
    public function addMore()
    {
        if($this->request->isAjax()){
            $post = (new DeskValidate())->goCheck('addMore',['shop_id'=>$this->shop_id]);
            DeskLogic::addMore($post);
            return JsonServer::success('操作成功');
        }

        return view('');
    }

    /**
     * @notes 编辑
     * @return \think\response\Json|\think\response\View
     * @author ljj
     * @date 2024/2/1 9:44 上午
     */
    public function edit()
    {
        if($this->request->isAjax()){
            $post = (new DeskValidate())->goCheck('edit');
            DeskLogic::edit($post);
            return JsonServer::success('操作成功');
        }
        $id = $this->request->get('id');
        $detail = DeskLogic::detail($id);
        return view('', [
            'detail' => $detail
        ]);
    }

    /**
     * @notes 删除
     * @return \think\response\Json
     * @author ljj
     * @date 2024/2/1 9:48 上午
     */
    public function del()
    {
        $post = (new DeskValidate())->goCheck('del');
        DeskLogic::del($post);
        return JsonServer::success('操作成功');
    }

    /**
     * @notes 二维码
     * @return \think\response\Json|\think\response\View
     * @author ljj
     * @date 2024/2/1 2:52 下午
     */
    public function qrcode()
    {
        $id = $this->request->get('id');
        $result = DeskLogic::qrcode($id,$this->shop_id);
        if ($result === false) {
            return JsonServer::error(DeskLogic::getError());
        }
        return view('', [
            'result' => $result ?? ''
        ]);
    }

    /**
     * @notes 桌贴压缩
     * @return \think\response\Json
     * @author ljj
     * @date 2024/2/1 6:37 下午
     */
    public function stickerZip()
    {
        $post = (new DeskValidate())->goCheck('stickerZip',['shop_id'=>$this->shop_id]);
        $result = DeskLogic::stickerZip($post);
        if ($result === false) {
            return JsonServer::error(DeskLogic::getError());
        }
        return JsonServer::success('操作成功',$result);
    }

    /**
     * @notes 更新二维码
     * @return \think\response\Json|true
     * @author ljj
     * @date 2024/8/9 下午1:46
     */
    public function updateQrcode()
    {
        $post = (new DeskValidate())->goCheck('updateQrcode',['shop_id'=>$this->shop_id]);
        $result = DeskLogic::updateQrcode($post);
        if ($result === false) {
            return JsonServer::error(DeskLogic::getError());
        }
        return JsonServer::success('更新成功');
    }
}