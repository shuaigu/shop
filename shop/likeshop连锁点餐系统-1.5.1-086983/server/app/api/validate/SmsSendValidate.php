<?php
// +----------------------------------------------------------------------
// | likeshop100%开源免费商用商城系统
// +----------------------------------------------------------------------
// | 欢迎阅读学习系统程序代码，建议反馈是我们前进的动力
// | 开源版本可自由商用，可去除界面版权logo
// | 商业版本务必购买商业授权，以免引起法律纠纷
// | 禁止对系统程序代码以任何目的，任何形式的再发布
// | gitee下载：https://gitee.com/likeshop_gitee
// | github下载：https://github.com/likeshop-github
// | 访问官网：https://www.likeshop.cn
// | 访问社区：https://home.likeshop.cn
// | 访问手册：http://doc.likeshop.cn
// | 微信公众号：likeshop技术社区
// | likeshop团队 版权所有 拥有最终解释权
// +----------------------------------------------------------------------
// | author: likeshopTeam
// +----------------------------------------------------------------------
namespace app\api\validate;
use app\common\enum\NoticeEnum;
use app\common\basics\Validate;
use app\common\model\user\User;

/***
 * 发送短信验证类
 */
class SmsSendValidate extends Validate
{
    protected $rule = [
        'key'       => 'require|checkKey',
        'mobile'    => 'require|mobile',
    ];

    protected $message = [
        'key.require'       => '缺少场景参数',
        'mobile.require'    => '请输入手机号码',
        'mobile.mobile'     => '手机号码格式错误',
    ];

    public function checkKey($value, $rule, $data)
    {
        $smsCode = NoticeEnum::SMS_SCENE[$value] ?? '';
        //注册、变更手机号码
        if($smsCode == NoticeEnum::REGISTER_NOTICE || $smsCode == NoticeEnum::CHANGEMOBILE_NOTICE){
            $mobile = User::where(['mobile'=>$data['mobile']])->findOrEmpty();
            if(!$mobile->isEmpty()){
                return '手机号码已注册';
            }
        }
        //忘记密码、登录
        if($smsCode == NoticeEnum::RESETPASSWORD_NOTICE || $smsCode == NoticeEnum::CHANGEMOBILE_NOTICE){
            $mobile = User::where(['mobile'=>$data['mobile']])->findOrEmpty();
            if($mobile->isEmpty()){
                return '手机号码未注册';
            }
        }
        return true;
    }

}