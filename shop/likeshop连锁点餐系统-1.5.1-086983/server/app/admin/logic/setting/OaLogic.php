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
namespace app\admin\logic\setting;
use app\common\basics\Logic;
use app\common\server\ConfigServer;
use app\common\server\UrlServer;
use app\common\server\WeChatServer;
use EasyWeChat\Factory;
use EasyWeChat\Kernel\Exceptions\Exception;

class OaLogic  extends Logic{

    /**
     * @notes 获取公众号配置
     * @return array
     * @author cjhao
     * @date 2023/10/16 18:08
     */
    public static function getOa(){
        $domain_name = $_SERVER['SERVER_NAME'];
        $qr_code = ConfigServer::get('oa', 'qr_code', '');
        $config = [
            'name'              => ConfigServer::get('oa', 'name', ''),
            'original_id'       => ConfigServer::get('oa', 'original_id', ''),
            'qr_code'           => $qr_code,
            'abs_qr_code'       => UrlServer::getFileUrl($qr_code),
            'app_id'            => ConfigServer::get('oa', 'app_id', ''),
            'app_secret'        => ConfigServer::get('oa', 'secret', ''),
            'url'               => url('api/weChat/index',[],'',true),
            'token'             => ConfigServer::get('oa', 'token', 'LikeShop'),
            'encoding_ses_key'  => ConfigServer::get('oa', 'encoding_ses_key', ''),
            'encryption_type'   => ConfigServer::get('oa', 'encryption_type', 1),
            'business_domain'   => $domain_name,
            'safety_domain'     => $domain_name,
            'auth_domain'       => $domain_name,
            ];
        return $config;
    }

    /**
     * @notes 设置公众号配置
     * @param $post
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     * @author cjhao
     * @date 2023/10/16 18:09
     */
    public static function setOa($post){
        if($post){
            if(!isset($post['encryption_type'])){
                $post['encryption_type'] = '';
            }
            ConfigServer::set('oa','name',$post['name']);
            ConfigServer::set('oa','original_id',$post['original_id']);
            ConfigServer::set('oa','qr_code',$post['qr_code'] ?? '');
            ConfigServer::set('oa','app_id',$post['app_id']);
            ConfigServer::set('oa','secret',$post['app_secret']);
            ConfigServer::set('oa','token',$post['token']);
            ConfigServer::set('oa','encoding_ses_key',$post['encoding_ses_key']);
            ConfigServer::set('oa','encryption_type',$post['encryption_type']);
        }
    }

    /**
     * @notes 发布菜单
     * @param $buttons
     * @return mixed
     * @throws \GuzzleHttp\Exception\GuzzleException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     * @author cjhao
     * @date 2023/10/16 18:09
     */
    public static function pulishMenu($buttons){
        try {
            $config = WeChatServer::getOaConfig();

            if(empty($config['app_id']) || empty($config['secret'])){
                self::$error = '请先配置微信公众号参数';
                return false;

            }

            $app = Factory::officialAccount($config);

            $result = $app->menu->create($buttons);

            if($result['errcode'] == 0){

                ConfigServer::set('menu','wechat_menu',$buttons);
                return '菜单发布成功';
            }
            self::$error = '菜单发布失败:'.json_encode($result);
            return false;

        } catch (Exception $e){
            self::$error = $e->getMessage();
            return false;

        }


    }
}