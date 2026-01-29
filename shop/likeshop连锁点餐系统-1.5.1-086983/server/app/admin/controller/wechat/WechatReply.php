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
namespace app\admin\controller\wechat;
use app\admin\logic\setting\WechatReplyLogic;
use app\admin\validate\WeChatReplyValidate;
use app\common\basics\AdminBase;
use app\common\enum\WeChatEnum;
use app\common\server\JsonServer;
use think\response\Json;

/**
 * 回复控制器类
 * Class WechatReply
 * Package app\admin\controller\setting
 */
class WechatReply extends AdminBase {


    /**
     * @notes 回复列表
     * @return \think\response\Json|\think\response\View
     * @author cjhao
     * @date 2023/10/16 18:27
     */
    public function lists(){
        if($this->request->isAjax()){
            $get = $this->request->get();
            $list = WechatReplyLogic::lists($get);
            return JsonServer::success('',$list);

        }
        $type_list= WeChatEnum::getCustomReply();
        return view('', ['type_list' =>$type_list]);
    }

    /**
     * @notes 添加回复
     * @return mixed
     * @author cjhao
     * @date 2023/10/16 18:27
     */
    public function add(){
        if($this->request->isAjax()){
            $post = $this->request->post();
            (new WeChatReplyValidate())->goCheck($post['reply_type']);
            WechatReplyLogic::add($post);
            return JsonServer::success('添加成功');
        }
        $type = $this->request->get('type');
        $template = 'add_'.$type;
        $type_list= WeChatEnum::getCustomReply();
        return view($template, ['type_list' =>$type_list]);
    }

    /**
     * @notes 编辑回复
     * @param $id
     * @return mixed
     * @author cjhao
     * @date 2023/10/16 18:27
     */
    public function edit($id){
        if($this->request->isAjax()){
            $post = $this->request->post();
            (new WeChatReplyValidate())->goCheck($post['reply_type']);
            WechatReplyLogic::edit($post);
            return JsonServer::success('编辑成功');

        }
        $detail = WechatReplyLogic::getReply($id);
        $template = 'edit_'.$detail['reply_type'];
        return view($template, ['detail' =>$detail]);

    }

    /**
     * @notes 删除回复
     * @param $id
     * @return Json
     * @author cjhao
     * @date 2023/10/16 18:28
     */
    public function del($id){
        (new WeChatReplyValidate())->goCheck('del');
        WechatReplyLogic::del($id);
        return JsonServer::success('删除成功');

    }

    /*
    * 修改字段
    */
    public function changeFields(){
        $pk_value = $this->request->post('id');
        $field = $this->request->post('field');
        $field_value = $this->request->post('value');
        $reply_type = $this->request->post('reply_type');
        $result = WechatReplyLogic::changeFields($pk_value, $field, $field_value,$reply_type);
        if ($result) {
            return JsonServer::success('修改成功');
        }
        return JsonServer::error('修改失败');
    }
}