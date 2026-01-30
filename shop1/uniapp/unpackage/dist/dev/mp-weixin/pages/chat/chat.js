"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "chat",
  setup(__props) {
    const id = common_vendor.ref("");
    const name = common_vendor.ref("");
    const messages = common_vendor.ref([]);
    const content = common_vendor.ref("");
    const myId = common_vendor.ref("");
    const lastId = common_vendor.ref("");
    const { proxy } = common_vendor.getCurrentInstance();
    common_vendor.onLoad((options) => {
      id.value = options.id;
      name.value = options.name;
      common_vendor.index.setNavigationBarTitle({ title: name.value });
      const user = JSON.parse(common_vendor.index.getStorageSync("user") || "{}");
      myId.value = user.id;
      fetchMessages();
    });
    const fetchMessages = async () => {
      try {
        const res = await proxy.$request({ url: `/conversations/messages?conversation_id=${id.value}` });
        if (res.success) {
          messages.value = res.data.reverse();
          if (messages.value.length > 0) {
            common_vendor.nextTick$1(() => {
              lastId.value = "msg-" + messages.value[messages.value.length - 1].id;
            });
          }
        }
      } catch (e) {
      }
    };
    const sendMsg = async () => {
      if (!content.value)
        return;
      try {
        const res = await proxy.$request({
          url: "/conversations/messages",
          method: "POST",
          data: {
            conversation_id: id.value,
            content: content.value,
            message_type: "text"
          }
        });
        if (res.success) {
          content.value = "";
          fetchMessages();
        }
      } catch (e) {
      }
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(messages.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.avatar || "/static/default_avatar.png",
            b: item.message_type === "text"
          }, item.message_type === "text" ? {
            c: common_vendor.t(item.content)
          } : item.message_type === "image" ? {
            e: item.file_url
          } : {}, {
            d: item.message_type === "image",
            f: item.id,
            g: "msg-" + item.id,
            h: item.sender_id == myId.value ? 1 : ""
          });
        }),
        b: lastId.value,
        c: common_vendor.o(sendMsg),
        d: content.value,
        e: common_vendor.o(($event) => content.value = $event.detail.value),
        f: common_vendor.o(sendMsg)
      };
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/chat/chat.js.map
