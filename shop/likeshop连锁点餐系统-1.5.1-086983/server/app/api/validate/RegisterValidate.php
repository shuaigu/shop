<?php
namespace app\api\validate;

use app\common\enum\ClientEnum;
use app\common\enum\NoticeEnum;
use app\common\model\user\User;
use app\common\logic\SmsLogic;
use app\common\basics\Validate;
use app\common\server\ConfigServer;

class RegisterValidate extends Validate
{
    protected $regex = [
        'password' => '/^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)]|[\(\)])+$)([^(0-9a-zA-Z)]|[\(\)]|[a-z]|[A-Z]|[0-9]){6,20}$/'
    ];
    protected $rule = [
        'mobile' => 'require|mobile|checkMobile',
        'password' => 'require|length:6,20|regex:password|confirm',
        'password_confirm' => 'require',
        'code' => 'checkCode',
        'client' => 'require|in:'.ClientEnum::mnp.','.ClientEnum::oa.','.ClientEnum::h5
    ];

    protected $message = [
        'mobile.require'            => '请输入手机号',
        'mobile.mobile'             => '无效的手机号码',
        'password.require'          => '请输入密码',
        'password.length'           => '密码须在6-20位之间',
        'password.regex'            => '密码须为数字,字母或符号组合',
        'password.confirm'          => '密码不一致',
        'password_confirm.require'  => '请输入确认密码',
        'code.requireIf'            => '请输入验证码',
        'client.require'            => '请输入客户端',
        'client.in'                 => '无效的客户端',

    ];

    public function checkCode($value, $rule, $data)
    {
        $regisetSms = ConfigServer::get('login', 'register_sms', 0);
        if(0 == $regisetSms){
            return true;
        }
        $res = SmsLogic::check(NoticeEnum::REGISTER_NOTICE, $data['mobile'], $value);
        if (false === $res) {
            return SmsLogic::getError();
        }
        return true;
    }

    public function checkMobile($value, $data, $rule)
    {
        $where = [
            'del' => 0,
            'mobile' => $value
        ];
        //检查手机号是否已存在
        $user = User::where($where)->findOrEmpty();
        if (!$user->isEmpty()) {
            return '此手机号已被使用';
        }
        return true;
    }
}