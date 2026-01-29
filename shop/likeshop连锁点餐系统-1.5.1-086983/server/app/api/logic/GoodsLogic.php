<?php


namespace app\api\logic;

use app\common\basics\Logic;
use app\common\model\goods\Goods;
use app\common\model\goods\GoodsCategory;
use app\common\logic\GoodsLogic as CommonGoodsLogic;
use app\common\model\shop\Shop;
use app\common\server\UrlServer;

/**
 * 商品逻辑层
 * Class GoodsLogic
 * @package app\api\logic
 */
class GoodsLogic extends Logic
{
    /**
     * @notes 门店商品列表
     * @param $params
     * @param $page_no
     * @param $page_size
     * @return mixed
     * @author ljj
     * @date 2021/9/7 3:22 下午
     */
    public static function lists($params,$page_no,$page_size,$user_id)
    {
        //记录店铺访问量
        event('ShopStat', $params['shop_id']);

        $where[] = ['gc.del', '=', 0];
        $where[] = ['sg.status', '=', 1];
        $where[] = ['sg.shop_id', '=', $params['shop_id']];
        if (isset($params['category_id']) && !empty($params['category_id'])) {
            $where[] = ['gc.id', '=', $params['category_id']];
        }

        $lists = GoodsCategory::alias('gc')
            ->join('goods g', 'g.goods_category_id = gc.id')
            ->join('shop_goods sg', 'g.id = sg.goods_id')
            ->with(['goods' => function($query) use($params) {
                $query->alias('g')->join('shop_goods sg', 'g.id = sg.goods_id')
                    ->where(['sg.shop_id'=>$params['shop_id'],'sg.status'=>1])
                    ->order('sort','asc')
                    ->field('g.id,sg.id as shop_goods_id,g.name,g.goods_category_id,g.image,g.remark,g.spec_type')
                    ->order(['g.sort'=>'asc','g.id'=>'desc']);
            }])
            ->field('gc.id,gc.name,gc.image')
            ->where($where)
            ->order(['gc.sort'=>'asc','gc.id'=>'desc'])
            ->group('gc.id')
            ->select()
            ->toArray();

        //购物车中的商品信息
        if ($user_id) {
            $cart_goods_info = CommonGoodsLogic::getCartGoodsInfo($user_id,$params['shop_id']);
        }


        foreach ($lists as &$list) {
            $goods_ids = array_column($list['goods'],'id');
            $goods_price = CommonGoodsLogic::getGoodsPrice($params['shop_id'],$goods_ids);
            $goods_spec = CommonGoodsLogic::getGoodsSpec($goods_ids);

            foreach ($list['goods'] as &$val) {
                //商品价格
                $val['price'] = array_values($goods_price['goods_item'][$val['id']])[0]['price'];

                //商品SKU
                $val['goods_item'] = array_values($goods_price['goods_item'][$val['id']]);
                //商品物料
                $val['goods_material'] = $goods_price['goods_material'][$val['id']] ?? [];

                //商品规格
                $val['goods_spec_list'] = $goods_spec[$val['id']];

                //购物车中的商品信息
                $val['cart_goods_num'] = $cart_goods_info[$val['id']]['num'] ?? 0;
                $val['cart_id'] = $cart_goods_info[$val['id']]['id'] ?? 0;
            }
        }

        return $lists;
    }


    /**
     * @notes 获取商品详情
     * @param $id
     * @return mixed
     * @author cjhao
     * @date 2023/6/26 11:31
     */
    public static function detail(int $id,$user_id)
    {

        $goods = Goods::alias('G')
            ->join('shop_goods SG','G.id = SG.goods_id')
            ->where(['SG.id'=>$id])
            ->field('G.id,SG.id as shop_goods_id,SG.shop_id,G.name,G.image,G.remark,G.spec_type')
            ->findOrEmpty()->toArray();
        $goods['image'] = UrlServer::getFileUrl($goods['image']);

        $goods_item_info = CommonGoodsLogic::getGoodsPrice($goods['shop_id'],[$goods['id']]);
        //规格项
        $goods_spec = CommonGoodsLogic::getGoodsSpec($goods['id'])[$goods['id']] ?? [];
        //规格列表
        $goods_item = array_values($goods_item_info['goods_item'][$goods['id']] ?? []);
        //物料
        $goods_material = $goods_item_info['goods_material'][$goods['id']] ?? [];
        //门店信息
        $shop_info = Shop::where(['del'=>0,'id'=>$goods['shop_id']])
            ->append(['province_name','city_name','district_name'])
            ->json(['license'],true)
            ->field('id,name,phone,longitude,latitude,business_start_time,business_end_time,status,province_id,city_id,district_id,address,delivery_type,weekdays,license')
            ->findOrEmpty()->toArray();

        $goods['goods_spec_list'] = $goods_spec;
        $goods['goods_item'] = $goods_item;
        $goods['goods_material'] = $goods_material;
        $goods['cart_id'] = 0;
        $goods['car_goods_num'] = 0;
        $goods['shop_info'] = $shop_info;


        //购物车中的商品信息
        if ($user_id) {
            $cart_goods_info = CommonGoodsLogic::getCartGoodsInfo($user_id,$goods['shop_id'])[$goods['id']] ?? [];
            $goods['car_goods_num'] = $cart_goods_info['num'] ?? 0;
            $goods['cart_id'] = $cart_goods_info['id'] ?? 0;
        }

        return $goods;
    }

}
