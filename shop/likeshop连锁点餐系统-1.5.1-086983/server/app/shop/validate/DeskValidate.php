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

namespace app\shop\validate;


use app\common\basics\Validate;
use app\common\model\shop\ShopDesk;

class DeskValidate extends Validate
{
    protected $rule = [
        'id' => 'require',
        'number' => 'require|alphaNum|checkNumber',
        'number_min' => 'require|number',
        'number_max' => 'require|number|gt:number_min|checkNumberRange',
        'ids' => 'require|array',
        'number_prefix' => 'alphaNum',
    ];

    protected $message = [
        'id.require' => '参数缺失',
        'number.require' => '请输入桌号',
        'number.alphaNum' => '桌号必须为字母和数字',
        'number_min.require' => '请输入桌号范围最小值',
        'number_min.number' => '桌号范围最小值错误',
        'number_max.require' => '请输入桌号范围最大值',
        'number_max.number' => '桌号范围最大值错误',
        'number_max.gt' => '桌号范围最大值必须大于桌号范围最小值',
        'ids.require' => '参数缺失',
        'ids.array' => '参数错误',
        'number_prefix.alphaNum' => '前缀必须为字母和数字',
    ];


    public function sceneAdd()
    {
        return $this->only(['number']);
    }

    public function sceneAddMore()
    {
        return $this->only(['number_prefix','number_min','number_max']);
    }

    public function sceneEdit()
    {
        return $this->only(['id','number']);
    }

    public function sceneDel()
    {
        return $this->only(['id']);
    }

    public function sceneStickerZip()
    {
        return $this->only(['ids'])
            ->append('ids','checkStickerZip');
    }

    public function sceneUpdateQrcode()
    {
        return $this->only(['id']);
    }

    /**
     * @notes 校验桌号
     * @param $value
     * @param $rule
     * @param $data
     * @return bool|string
     * @author ljj
     * @date 2024/1/31 6:33 下午
     */
    public function checkNumber($value,$rule,$data)
    {
        $where[] = ['number','=',$value];
        $where[] = ['shop_id','=',$data['shop_id']];
        $where[] = ['del','=',0];
        if (isset($data['id']) && $data['id'] != '') {
            $where[] = ['id','<>',$data['id']];
        }
        $result = ShopDesk::where($where)->findOrEmpty();
        if (!$result->isEmpty()) {
            return '桌号重复，请重新输入';
        }
        return true;
    }

    /**
     * @notes 校验桌号范围
     * @param $value
     * @param $rule
     * @param $data
     * @return bool|string
     * @author ljj
     * @date 2024/1/31 6:38 下午
     */
    public function checkNumberRange($value,$rule,$data)
    {
        $desk = ShopDesk::where(['shop_id'=>$data['shop_id'],'del'=>0])->column('number','number');
        for ($number = $data['number_min'];$number <= $data['number_max'];$number++) {
            if (isset($desk[$data['number_prefix'].$number])) {
                return '存在重复桌号，请重新输入';
            }
        }

        return true;
    }


    /**
     * @notes 校验桌贴压缩
     * @param $value
     * @param $rule
     * @param $data
     * @return bool|string
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     * @author ljj
     * @date 2024/2/1 4:46 下午
     */
    public function checkStickerZip($value,$rule,$data)
    {
        $desk = ShopDesk::where(['id'=>$data['ids'],'del'=>0])->select()->toArray();
        foreach ($desk as $value) {
            if ($value['shop_id'] != $data['shop_id']) {
                return '存在错误数据';
            }
        }

        return true;
    }
}