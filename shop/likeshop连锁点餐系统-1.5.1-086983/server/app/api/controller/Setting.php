<?php
namespace app\api\controller;

use app\common\basics\Api;
use app\common\server\ConfigServer;
use app\common\server\JsonServer;
use app\common\server\UrlServer;
use app\common\model\shop\Shop;

class Setting extends Api
{
    public $like_not_need_login = ['getPlatformCustomerService', 'getShopCustomerService', 'getMarketingChatConfig'];

    /**
     * 平台客服
     */
    public function getPlatformCustomerService()
    {
        $image = ConfigServer::get('customer_service', 'image', '');
        $image = $image ? UrlServer::getFileUrl($image) : '';
        $config = [
            'wechat' => ConfigServer::get('customer_service', 'wechat', ''),
            'phone' => ConfigServer::get('customer_service', 'phone', ''),
            'business_time' => ConfigServer::get('customer_service', 'business_time', ''),
            'image' => $image
        ];
        return JsonServer::success('', $config);
    }

    /**
     * 获取营销聊天配置
     */
    public function getMarketingChatConfig()
    {
        // 从配置中获取营销聊天设置，如果没有配置则返回默认值
        $chatConfig = ConfigServer::get('marketing_chat', 'chat_flow', '');
        
        // 如果配置为空，返回默认配置
        if (empty($chatConfig)) {
            $chatConfig = $this->getDefaultChatConfig();
        } else {
            // 如果是JSON字符串，解码
            if (is_string($chatConfig)) {
                $chatConfig = json_decode($chatConfig, true);
            }
        }

        // 获取其他配置
        $serviceAvatar = ConfigServer::get('marketing_chat', 'service_avatar', '');
        $serviceAvatar = $serviceAvatar ? UrlServer::getFileUrl($serviceAvatar) : 'https://img.yzcdn.cn/vant/cat.jpeg';
        
        $config = [
            'chat_flow' => $chatConfig,
            'service_avatar' => $serviceAvatar,
            'banner_title' => ConfigServer::get('marketing_chat', 'banner_title', '我们帮您把业务/产品推广出去'),
            'banner_subtitle' => ConfigServer::get('marketing_chat', 'banner_subtitle', '您只需要等着客户主动找上门'),
            'footer_text' => ConfigServer::get('marketing_chat', 'footer_text', '页面信息及服务由XXX企业管理有限公司提供'),
        ];

        return JsonServer::success('', $config);
    }

    /**
     * 默认营销聊天配置
     */
    private function getDefaultChatConfig()
    {
        return [
            [
                'type' => 'service',
                'content' => '我们是做全行业获客的专业团队，能够帮助您精准获取客户；意向客户会主动添加您，全行业均可做；若您有需求，请认真回答以下问题。',
                'delay' => 500
            ],
            [
                'type' => 'service',
                'content' => '您是否整面临获客难、成本高的问题？',
                'delay' => 1000,
                'waitForResponse' => true,
                'responseKey' => 'hasCustomerProblem',
                'buttons' => [
                    ['text' => '是', 'value' => true],
                    ['text' => '否', 'value' => false]
                ]
            ],
            [
                'type' => 'service',
                'content' => '您想要获取哪里的客户？',
                'delay' => 800,
                'waitForResponse' => true,
                'responseKey' => 'customerLocation',
                'buttons' => [
                    ['text' => '本地客户', 'value' => 'local'],
                    ['text' => '全国客户', 'value' => 'national']
                ]
            ],
            [
                'type' => 'service',
                'content' => '我们提供精准客户，您是否接受1000-3000/年的合作费用？',
                'delay' => 800,
                'waitForResponse' => true,
                'responseKey' => 'acceptPrice',
                'buttons' => [
                    ['text' => '是', 'value' => true, 'type' => 'primary'],
                    ['text' => '否', 'value' => false, 'type' => 'warning']
                ]
            ],
            [
                'type' => 'service',
                'content' => '太棒了！请留下您的联系方式，我们的专业顾问将在24小时内与您联系。',
                'delay' => 800,
                'condition' => ['key' => 'acceptPrice', 'value' => true]
            ],
            [
                'type' => 'service',
                'content' => '感谢您的关注！如果以后有需要，随时欢迎咨询我们。',
                'delay' => 800,
                'condition' => ['key' => 'acceptPrice', 'value' => false]
            ]
        ];
    }

}
