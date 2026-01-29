<template>
  <view :data-theme="themeName">
    <!-- Hader 顶部固定 -->
    <view class="header">
      <view class="header-wrap">
        <u-tabs
          font-size="28"
          name="tabsName"
          inactive-color="#333"
          :active-color="themeColor"
          :list="tabList"
          :is-scroll="false"
          :current="current"
          @change="change"
        >
        </u-tabs>
      </view>
    </view>

    <template v-if="current == 0">
      <block v-for="(item, index) in list" :key="index">
        <view>
          <view class="letter">{{ index }}</view>
          <block v-for="(el, index2) in item" :key="index2">
            <button
              class="city flex row-left nr normal"
              @click="selectCity(el)"
            >
              {{ el.name }}
            </button>
          </block>
        </view>
      </block>

      <!-- slider -->
      <view
        class="rightFixed"
        @touchstart.stop.prevent="move"
        @touchmove.stop.prevent="move"
      >
        <block v-for="(item, index) in list" :key="index">
          <view :class="'title ' + (index == active ? 'active' : '')">
            {{ index }}
          </view>
        </block>
      </view>
    </template>

    <template v-if="current == 1">
      <block v-for="(el, index2) in childrenCity" :key="index2">
        <button class="city flex row-left nr normal" @click="onSelectStore(el)">
          {{ el.name }}
        </button>
      </block>
    </template>
  </view>
</template>

<script>
import area from "@/utils/area.js";
import { trottle } from "@/utils/tools.js";
export default {
  data() {
    return {
      current: 0,
      tabList: [
        {
          tabsName: "城市",
        },
        {
          tabsName: "地区",
        },
      ],

      currentCity: {},

      childrenCity: [],

      // 城市数据
      list: {},

      active: "A", //右侧小窗预览
      flag: false, //上锁，
      letter: [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "J",
        "K",
        "L",
        "M",
        "N",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "W",
        "X",
        "Y",
        "Z",
      ],

      leftY: [],
      rightObj: {},
    };
  },

  onLoad() {
    this.baseArea(area);
  },

  onPageScroll({ scrollTop }) {
    const leftY = this.leftY;
    leftY.forEach((item, index) => {
      if (item - 40 <= scrollTop && this.flag == false) {
        this.active = this.letter[index];
      }
    });
  },

  methods: {
    change(index) {
      if (Object.keys(this.currentCity).length == 0) return;
      this.current = index;
    },

    selectCity(el) {
      this.currentCity = el;
      this.getChildrenCity(el);
    },

    getChildrenCity(el) {
      let code = el.code,
        city;
      if (el.level == 1) {
        let parentCity = area.filter(
          (item) => item.parentCode == code && item.name.indexOf("市辖县") != 0
        );
        city = area.filter(
          (item) =>
            item.parentCode == parentCity[0].code &&
            item.name.indexOf("市辖区") != 0
        );
      } else {
        city = area.filter(
          (item) => item.parentCode == code && item.name.indexOf("市辖区") != 0
        );
      }
      this.current = 1;
      this.childrenCity = city;
    },

    onSelectStore(el) {
      console.log(el);
      let that = this;
      uni.chooseLocation({
        latitude: el.latitude,
        longitude: el.longitude,
        success: (res) => {
          uni.$emit("getLocations", res);
          that.$Router.back();
        },
        fail(e) {
          if (e.errMsg == "chooseLocation:fail cancel") return;
          uni.showModal({
            title: "温馨提示",
            content: e.errMsg,
          });
        },
      });
    },

    // 左侧移动
    move(event) {
      const y = parseInt(event.changedTouches[0].clientY);
      //列表长度
      const len = Object.keys(this.list).length;
      // 计算出右侧sliderbar的每个元素高度
      const itemHeight = parseInt(this.rightObj.height / len);
      // 计算出当前索引
      let index = Math.floor((y - this.rightObj.top) / itemHeight);
      if (index < 0) {
        index = 0;
      } else if (index > len - 1) {
        index = len - 1;
      }
      if (this.active != this.letter[index]) {
        this.flag = true;
        this.active = this.letter[index];
        uni.pageScrollTo({
          duration: 0,
          scrollTop: this.leftY[index] - 40,
        });

        this.$nextTick(() => {
          this.flag = false;
        });
      }
    },

    // 初始化城市数据
    baseArea(area) {
      // 因为省和直辖市的level 都是 1，需要过滤出来
      let resCity = area.filter(
        (item) => item.level == "1" && item.name.indexOf("市") != -1
      );
      //城市，拿到所有市
      let city = area.filter(
        (item) => item.level == "2" && item.name.indexOf("市") != -1
      );
      //将直辖市和普通城市放在一起
      city.push(...resCity);

      // 首字母汉字过滤器
      var firstAddress = {
        A: ["安", "鞍"],
        B: [
          "巴",
          "白",
          "百",
          "蚌",
          "包",
          "宝",
          "保",
          "北",
          "本",
          "毕",
          "滨",
          "毫",
        ],
        C: [
          "长",
          "沧",
          "常",
          "潮",
          "朝",
          "郴",
          "成",
          "承",
          "池",
          "赤",
          "重",
          "崇",
          "滁",
        ],
        D: ["达", "大", "丹", "德", "定", "东"],
        E: ["鄂"],
        F: ["防", "佛", "福", "抚", "阜"],
        G: ["赣", "固", "广", "贵", "桂"],
        H: [
          "哈",
          "海",
          "邯",
          "汉",
          "杭",
          "合",
          "河",
          "菏",
          "贺",
          "鹤",
          "黑",
          "衡",
          "呼",
          "湖",
          "葫",
          "怀",
          "淮",
          "黄",
          "惠",
        ],
        J: [
          "鸡",
          "吉",
          "济",
          "佳",
          "嘉",
          "江",
          "焦",
          "揭",
          "金",
          "锦",
          "晋",
          "荆",
          "景",
          "九",
          "酒",
        ],
        K: ["开", "克", "昆"],
        L: [
          "拉",
          "来",
          "莱",
          "兰",
          "廊",
          "乐",
          "丽",
          "连",
          "辽",
          "聊",
          "临",
          "柳",
          "六",
          "龙",
          "陇",
          "娄",
          "泸",
          "吕",
          "洛",
          "漯",
        ],
        M: ["马", "茂", "眉", "梅", "绵", "牡"],
        N: ["南", "内", "宁"],
        P: ["攀", "盘", "平", "莆", "濮", "普洱"],
        Q: ["七", "齐", "钦", "秦", "青", "清", "庆", "曲", "衢", "泉"],
        R: ["日"],
        S: [
          "三",
          "夏",
          "汕",
          "商",
          "上",
          "韶",
          "邵",
          "绍",
          "深",
          "沈",
          "十",
          "石",
          "双",
          "朔",
          "四",
          "松",
          "苏",
          "宿",
          "绥",
          "随",
          "遂",
        ],
        T: ["台", "太", "泰", "唐", "天", "铁", "通", "铜"],
        W: ["威", "潍", "渭", "温", "乌", "无", "吴", "芜", "梧", "武"],
        X: [
          "西",
          "咸",
          "湘",
          "襄",
          "孝",
          "忻",
          "新",
          "信",
          "邢",
          "徐",
          "许",
          "宣",
        ],
        Y: [
          "雅",
          "烟",
          "延",
          "盐",
          "扬",
          "阳",
          "伊",
          "宜",
          "宜",
          "益",
          "银",
          "鹰",
          "营",
          "永",
          "榆",
          "玉",
          "岳",
          "云",
          "运",
        ],
        Z: [
          "湛",
          "枣",
          "张",
          "漳",
          "昭",
          "肇",
          "镇",
          "郑",
          "中",
          "舟",
          "周",
          "珠",
          "株",
          "驻",
          "资",
          "淄",
          "自",
          "遵",
        ],
      };

      let list = {};

      for (let key in firstAddress) {
        list[key] = [];
        for (let i = 0; i < city.length; i++) {
          const name = city[i].name.substr(0, 1);
          const res = firstAddress[key].some((item) => item == name);
          if (res == true) {
            list[key].push(city[i]);
          }
        }
      }

      this.list = list;

      this.$nextTick(() => {
        this.getLocation();
      });
    },

    // 获取元素
    getLocation() {
      const title = uni.createSelectorQuery().selectAll(".rightFixed");
      title
        .boundingClientRect((res) => {
          this.rightObj = {
            height: res[0].height,
            top: res[0].top,
          };
        })
        .exec();

      const letter = uni.createSelectorQuery().selectAll(".letter");
      letter
        .boundingClientRect((res) => {
          res.top = parseInt(res.top);
          this.leftY = res.map((item) => parseInt(item.top));
        })
        .exec();
    },
  },
};
</script>

<style lang="scss">
.header {
  width: 100%;
  height: 110rpx;
  position: relative;
  &-wrap {
    width: 100%;
    height: 110rpx;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
  }
}

.letter {
  padding: 10rpx 24rpx;
}

.city {
  padding: 20rpx 24rpx;
  background-color: #ffffff;
}

.active {
  @include font_color();
}

// 右侧固定slider
.rightFixed {
  position: fixed;
  right: 0%;
  top: 180rpx;
  z-index: 100;

  view {
    color: #555;
    font-size: 28rpx;
    margin: 6rpx 40rpx;
    text-align: center;
  }
}
</style>
