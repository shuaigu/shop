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

namespace app\shop\logic;


use app\common\basics\Logic;
use app\common\logic\QrCodeLogic;
use app\common\model\shop\ShopDesk;
use app\common\server\ConfigServer;
use app\common\server\storage\Driver as StorageDriver;
use app\common\server\UrlServer;
use Endroid\QrCode\QrCode;
use think\Exception;
use think\facade\Db;

class DeskLogic extends Logic
{
    /**
     * @notes 桌号列表
     * @param $get
     * @param $shop_id
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     * @author ljj
     * @date 2024/1/31 4:54 下午
     */
    public static function lists($get,$shop_id)
    {
        $where[] = ['del','=',0];
        $where[] = ['shop_id','=',$shop_id];
        $lists = ShopDesk::field('id,number,remarks,create_time')
            ->where($where)
            ->page($get['page'], $get['limit'])
            ->order(['id'=>'desc'])
            ->select()
            ->toArray();

        $count = ShopDesk::where($where)->count();

        return ['count' => $count, 'lists' => $lists];
    }

    /**
     * @notes 新增桌号
     * @param $post
     * @return bool
     * @author ljj
     * @date 2024/1/31 4:59 下午
     */
    public static function add($post)
    {
        ShopDesk::create([
            'shop_id' => $post['shop_id'],
            'number' => $post['number'],
            'remarks' => $post['remarks'],
        ]);

        return true;
    }

    /**
     * @notes 批量新增桌号
     * @param $post
     * @return bool
     * @author ljj
     * @date 2024/1/31 6:39 下午
     */
    public static function addMore($post)
    {
        ini_set('max_execution_time', 300); // 设置超时时间为300秒

        $data = [];
        for ($number = $post['number_min'];$number <= $post['number_max'];$number++) {
            $data[] = [
                'shop_id' => $post['shop_id'],
                'number' => $post['number_prefix'].$number,
                'remarks' => $post['remarks'],
            ];
        }
        (new ShopDesk())->saveAll($data);

        return true;
    }

    /**
     * @notes 详情
     * @param $id
     * @return array
     * @author ljj
     * @date 2024/1/31 7:00 下午
     */
    public static function detail($id)
    {
        $result = ShopDesk::where(['id'=>$id])->findOrEmpty()->toArray();

        return $result;
    }

    /**
     * @notes 编辑
     * @param $post
     * @return bool
     * @author ljj
     * @date 2024/2/1 9:44 上午
     */
    public static function edit($post)
    {
        ShopDesk::update([
            'number' => $post['number'],
            'remarks' => $post['remarks'],
        ],['id'=>$post['id']]);

        return true;
    }

    /**
     * @notes 删除
     * @param $post
     * @return bool
     * @author ljj
     * @date 2024/2/1 9:48 上午
     */
    public static function del($post)
    {
        ShopDesk::update([
            'update_time' => time(),
            'del' => 1,
        ],['id'=>$post['id']]);

        return true;
    }

    /**
     * @notes 二维码
     * @param $id
     * @param $shop_id
     * @return array|false
     * @author ljj
     * @date 2024/2/1 2:52 下午
     */
    public static function qrcode($id,$shop_id)
    {
        Db::startTrans();
        try {
            $desk = ShopDesk::where(['id'=>$id,'shop_id'=>$shop_id])->findOrEmpty()->toArray();
            if (empty($desk)) {
                throw new \think\Exception('参数错误');
            }
            $h5_qrcode = $desk['h5_qrcode'];
            $h5_sticker = $desk['h5_sticker'];
            $mnp_qrcode = $desk['mnp_qrcode'];
            $mnp_sticker = $desk['mnp_sticker'];

            if (empty($h5_qrcode) || empty($h5_sticker) || empty($mnp_qrcode) || empty($mnp_sticker) || !file_exists(UrlServer::setFileUrl($h5_qrcode)) || !file_exists(UrlServer::setFileUrl($h5_sticker)) || !file_exists(UrlServer::setFileUrl($mnp_qrcode)) || !file_exists(UrlServer::setFileUrl($mnp_sticker))) {
                $result = self::getQrcode($desk);
                $h5_qrcode = $result['h5_qrcode'];
                $h5_sticker = $result['h5_sticker'];
                $mnp_qrcode = $result['mnp_qrcode'];
                $mnp_sticker = $result['mnp_sticker'];

                ShopDesk::update(['h5_qrcode'=>$result['h5_qrcode'],'h5_sticker'=>$result['h5_sticker'],'mnp_qrcode'=>$result['mnp_qrcode'],'mnp_sticker'=>$result['mnp_sticker']],['id'=>$id]);
            }

            Db::commit();
            return ['h5_qrcode'=>$h5_qrcode,'h5_sticker'=>$h5_sticker,'mnp_qrcode'=>$mnp_qrcode,'mnp_sticker'=>$mnp_sticker,'number'=>$desk['number'],'id'=>$desk['id']];
        }catch (\Exception $e){
            Db::rollback();
            self::$error = $e->getMessage();
            return false;
        }
    }

    /**
     * @notes 生成二维码图片
     * @param $desk
     * @return string[]
     * @throws Exception
     * @author ljj
     * @date 2024/2/1 2:51 下午
     */
    public static function getQrcode($desk)
    {
        //图片保存路径
        $save_dir = 'uploads/qr_code/desk/';
        $bg_img = 'static/common/image/default/desk_bg.png';
        !file_exists($save_dir) && mkdir($save_dir, 0777, true);

        $scene = 'sid='.$desk['shop_id'].'&num='.$desk['number'].'&did='.$desk['id'];
        //h5二维码
        $h5_qrcode_name = md5($desk['shop_id'].'h5'.$desk['number']).'.png';
        $h5_qrcode_url = $save_dir.$h5_qrcode_name;
        $h5_qrcode_url_full = request()->domain(true).'/'.$h5_qrcode_url;
        $h5_page = request()->domain(true).'/mobile?'.$scene;
        //小程序二维码
        $mnp_qrcode_name = md5($desk['shop_id'].'mnp'.$desk['number']).'.png';
        $mnp_qrcode_url = $save_dir.$mnp_qrcode_name;
        $mnp_qrcode_url_full = request()->domain(true).'/'.$mnp_qrcode_url;
        $mnp_page = 'pages/index/index';
        //H5桌贴
        $h5_sticker_name = md5($desk['shop_id'].'h5_sticker'.$desk['number']).'.png';
        $h5_sticker_url = $save_dir.$h5_sticker_name;
        $h5_sticker_url_full = request()->domain(true).'/'.$h5_sticker_url;
        //小程序桌贴
        $mnp_sticker_name = md5($desk['shop_id'].'mnp_sticker'.$desk['number']).'.png';
        $mnp_sticker_url = $save_dir.$mnp_sticker_name;
        $mnp_sticker_url_full = request()->domain(true).'/'.$mnp_sticker_url;

        //生成小程序二维码
        $result = (new QrCodeLogic())->makeMnpQrcode($scene,$mnp_page,$mnp_qrcode_name,$save_dir);
        if(true !== $result){
            throw new \think\Exception('微信配置错误：'.$result);
        }

        //生成H5二维码
        $qrCode = new QrCode();
        $qrCode->setText($h5_page);
        $qrCode->setSize(430);
        $qrCode->setWriterByName('png');
        $qrCode->writeFile($h5_qrcode_url);

        //生成带背景图的二维码
        $qr_code_logic = new QrCodeLogic();
        $qrcode_config = ['w'=>610,'h'=>610,'x'=>215,'y'=>345];
        list($width,$height,$type,$attr) =  getimagesize ($bg_img);
        $font_size = 40;
        $font_face = ROOT_PATH.'/font/SourceHanSansCN-Bold.otf';
        $number_str_arr = imagettfbbox($font_size,0,$font_face,$desk['number']);
        $number_str_width = $number_str_arr[2] - $number_str_arr[0];
        $text_config = ['color'=>'#ffffff','font_face'=>$font_face,'font_size'=>$font_size,'x'=>($width-$number_str_width)/2,'y'=>1080];

        //生成H5桌贴
        //获取背景图
        $get_bg_img_h5 = imagecreatefromstring(file_get_contents($bg_img));
        //合并二维码
        $qr_code_logic->writeImg($get_bg_img_h5,$h5_qrcode_url,$qrcode_config,false);
        //合成桌号
        $qr_code_logic->writeText($get_bg_img_h5, $desk['number'],$text_config);
        imagepng($get_bg_img_h5, $h5_sticker_url);

        //生成H5桌贴
        //获取背景图
        $get_bg_img_mnp = imagecreatefromstring(file_get_contents($bg_img));
        //合并二维码
        $qr_code_logic->writeImg($get_bg_img_mnp,$mnp_qrcode_url,$qrcode_config,false);
        //合成桌号
        $qr_code_logic->writeText($get_bg_img_mnp, $desk['number'],$text_config);
        imagepng($get_bg_img_mnp, $mnp_sticker_url);


        //生成的图片根据不同的存储方式储存
        $config = [
            'default' => ConfigServer::get('storage', 'default', 'local'),
            'engine' => ConfigServer::get('storage_engine')
        ];
        if (empty($config['engine']['local'])) {
            $config['engine']['local'] = [];
        }
        if ($config['default'] != 'local') {
            $StorageDriver = new StorageDriver($config);
            if (!$StorageDriver->fetch($h5_qrcode_url_full, $h5_qrcode_url)) {
                throw new Exception('H5二维码保存出错:' . $StorageDriver->getError());
            }
            if (!$StorageDriver->fetch($h5_sticker_url_full, $h5_sticker_url)) {
                throw new Exception('H5桌贴二维码保存出错:' . $StorageDriver->getError());
            }
            if (!$StorageDriver->fetch($mnp_qrcode_url_full, $mnp_qrcode_url)) {
                throw new Exception('小程序二维码保存出错:' . $StorageDriver->getError());
            }
            if (!$StorageDriver->fetch($mnp_sticker_url_full, $mnp_sticker_url)) {
                throw new Exception('小程序桌贴保存出错:' . $StorageDriver->getError());
            }
            //删除本地图片
            @unlink($h5_qrcode_url);
            @unlink($h5_sticker_url);
            @unlink($mnp_qrcode_url);
            @unlink($mnp_sticker_url);
        }

        return ['h5_qrcode'=>$h5_qrcode_url_full,'h5_sticker'=>$h5_sticker_url_full,'mnp_qrcode'=>$mnp_qrcode_url_full,'mnp_sticker'=>$mnp_sticker_url_full];
    }

    /**
     * @notes 桌贴压缩
     * @param $post
     * @return array|false
     * @author ljj
     * @date 2024/2/1 6:37 下午
     */
    public static function stickerZip($post)
    {
        ini_set('max_execution_time', 300); // 设置超时时间为300秒

        Db::startTrans();
        try {
            // 检查 ZipArchive 是否可用
            if (!class_exists('ZipArchive')) {
                throw new Exception('压缩文件错误');
            }

            $save_dir = 'uploads/desk/'.$post['shop_id'].'/';
            !file_exists($save_dir) && mkdir($save_dir, 0777, true);
            $zip_name = $save_dir.'sticker.zip';//压缩文件
            if (file_exists($zip_name)) {
                unlink($zip_name);
            }
            $files_mnp = [];//小程序桌贴
            $files_h5 = [];//H5桌贴
            $updata = [];
            foreach ($post['ids'] as $key=>$id) {
                $desk = ShopDesk::where(['id'=>$id])->findOrEmpty()->toArray();
                $mnp_sticker = $desk['mnp_sticker'];
                $h5_sticker = $desk['h5_sticker'];
                if (empty($h5_sticker) || empty($mnp_sticker) || !file_exists($h5_sticker) || !file_exists($mnp_sticker)) {
                    $result = self::getQrcode($desk);
                    $h5_sticker = $result['h5_sticker'];
                    $mnp_sticker = $result['mnp_sticker'];

                    $updata[] = ['id'=>$id,'h5_qrcode'=>$result['h5_qrcode'],'h5_sticker'=>$result['h5_sticker'],'mnp_qrcode'=>$result['mnp_qrcode'],'mnp_sticker'=>$result['mnp_sticker']];
                }
                $files_mnp[$key]['number'] = $desk['number'];
                $files_mnp[$key]['sticker'] = $mnp_sticker;
                $files_mnp[$key]['key'] = 'mnp';
                $files_h5[$key]['number'] = $desk['number'];
                $files_h5[$key]['sticker'] = $h5_sticker;
                $files_h5[$key]['key'] = 'h5';
            }
            (new ShopDesk())->saveAll($updata);
            $files = array_merge($files_mnp,$files_h5);

            // 创建一个 ZipArchive 对象
            $zip = new \ZipArchive();
            // 打开或创建 ZIP 文件（如果不存在则创建，存在则覆盖）
            if($zip->open($zip_name, \ZipArchive::CREATE)) {
                foreach ($files as $value) {
                    // 添加单个文件到压缩包中
                    $zip->addFile(UrlServer::setFileUrl($value['sticker']),$value['key'].'/'.$value['number'].'.png'); // 第二个参数是压缩包内的文件名
                }
                // 关闭 zip 文件以完成写入操作
                $zip->close();
            }

            Db::commit();
            return ['url'=>UrlServer::getFileUrl($zip_name)];
        }catch (\Exception $e){
            Db::rollback();
            self::$error = $e->getMessage();
            return false;
        }
    }


    /**
     * @notes 更新二维码
     * @param $post
     * @return array|false|true
     * @author ljj
     * @date 2024/8/9 下午1:43
     */
    public static function updateQrcode($post)
    {
        Db::startTrans();
        try {
            $desk = ShopDesk::where(['id'=>$post['id'],'shop_id'=>$post['shop_id']])->findOrEmpty()->toArray();
            if (empty($desk)) {
                throw new \think\Exception('桌贴不存在');
            }

            $result = self::getQrcode($desk);
            ShopDesk::update(['h5_qrcode'=>$result['h5_qrcode'],'h5_sticker'=>$result['h5_sticker'],'mnp_qrcode'=>$result['mnp_qrcode'],'mnp_sticker'=>$result['mnp_sticker']],['id'=>$post['id']]);

            Db::commit();
            return true;
        }catch (\Exception $e){
            Db::rollback();
            self::$error = $e->getMessage();
            return false;
        }
    }
}