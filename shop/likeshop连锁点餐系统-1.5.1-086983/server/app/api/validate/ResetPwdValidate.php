<?php
namespace app\api\validate;

use app\common\basics\Validate;
use app\common\enum\NoticeEnum;
use app\common\model\user\User;
use app\common\logic\SmsLogic;


class ResetPwdValidate extends Validate
{
    protected $regex = [
        'password' => '/^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)]|[\(\)])+$)([^(0-9a-zA-Z)]|[\(\)]|[a-z]|[A-Z]|[0-9]){6,20}$/'
    ];

    protected $rule = [
        'mobile'    => 'require|mobile|checkMobile',
        'password'  => 'require|length:6,20|regex:password',
        'code'      => 'require|checkCode'

    ];

    protected  $message = [
        'mobile.require'        => '请输入手机号',
        'mobile.mobile'         => '手机号码错误',
        'password.require'      => '请输入密码',
        'password.length'       => '密码须在6-20位之间',
        'password.regex'        => '密码须为数字,字母或符号组合',
        'code.require'          => '请输入验证码'
    ];


    public function checkMobile($value, $rule, $data)
    {
        $user = User::where(['mobile'=>$value])->findOrEmpty();
        if($user->isEmpty()){
            return '手机号码未注册';
        }
        return true;

    }


    /***
     * 验证验证码
     * @param $value
     * @param $rule
     * @param $data
     * @return bool
     */
    public static function checkCode($value, $rule, $data)
    {
        $message_key = NoticeEnum::RESETPASSWORD_NOTICE;
        $res = SmsLogic::check($message_key, $data['mobile'], $value);
        if (false === $res) {
            return SmsLogic::getError();
        }
        return true;
    }
}