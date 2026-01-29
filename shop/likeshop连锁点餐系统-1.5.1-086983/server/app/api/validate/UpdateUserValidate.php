<?php
namespace app\api\validate;

use app\common\basics\Validate;
use app\common\model\user\User;

/**
 * 更新用户信息验证器
 * Class UpdateUserValidate
 * @package app\api\validate
 */
class UpdateUserValidate extends Validate
{
    protected $rule = [
        'avatar' => 'require',
        'nickname' => 'require',
        'mobile' => 'mobile|checkMobile',
        'sex' => 'require|in:0,1,2',
    ];

    protected $message = [
        'avatar.require' => '头像不能为空',
        'nickname.require' => '用户昵称不能为空',
        'sex.require' => '性别不能为空',
    ];


    public function sceneSet()
    {
        $this->only(['avatar', 'nickname', 'mobile', 'sex']);
    }

    public function sceneUpdateUser()
    {
        $this->only(['avatar','nickname']);

    }


    //检查新手机号是否已存在
    protected function checkMobile($value, $rule, $data)
    {
        $user = User::where([
            ['mobile', '=', $value],
            ['id', '<>', $data['user_id']]
        ])->findOrEmpty();

        if (!$user->isEmpty()) {
            return '此手机号已被使用';
        }
        return true;
    }

}