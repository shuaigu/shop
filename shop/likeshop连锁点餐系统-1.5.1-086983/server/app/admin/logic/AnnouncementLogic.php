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

namespace app\admin\logic;


use app\common\basics\Logic;
use app\common\model\Announcement;

/**
 * 门店公告逻辑层
 * Class AnnouncementLogic
 * @package app\admin\logic
 */
class AnnouncementLogic extends Logic
{
    /**
     * @notes 公告列表
     * @param $get
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     * @author ljj
     * @date 2024/2/2 4:37 下午
     */
    public static function lists($get)
    {
        $where[] = ['del','=',0];
        $lists = Announcement::field('id,name,views,sort,create_time')
            ->where($where)
            ->page($get['page'], $get['limit'])
            ->order(['sort'=>'asc','id'=>'desc'])
            ->select()
            ->toArray();

        $count = Announcement::where($where)->count();

        return ['count' => $count, 'lists' => $lists];
    }

    /**
     * @notes 新增
     * @param $post
     * @return bool
     * @author ljj
     * @date 2024/2/2 4:46 下午
     */
    public static function add($post)
    {
        Announcement::create([
            'name' => $post['name'],
            'content' => $post['content'],
            'sort' => $post['sort'],
        ]);

        return true;
    }

    /**
     * @notes 编辑
     * @param $post
     * @return bool
     * @author ljj
     * @date 2024/2/3 10:27 上午
     */
    public static function edit($post)
    {
        Announcement::update([
            'name' => $post['name'],
            'content' => $post['content'],
            'sort' => $post['sort'],
        ],['id'=>$post['id']]);

        return true;
    }

    /**
     * @notes 详情
     * @param $id
     * @return array
     * @author ljj
     * @date 2024/2/3 10:28 上午
     */
    public static function detail($id)
    {
        $result = Announcement::where(['id'=>$id])->findOrEmpty()->toArray();

        return $result;
    }

    /**
     * @notes 删除
     * @param $post
     * @return bool
     * @author ljj
     * @date 2024/2/3 10:32 上午
     */
    public static function del($post)
    {
        Announcement::update([
            'update_time' => time(),
            'del' => 1,
        ],['id'=>$post['id']]);

        return true;
    }
}