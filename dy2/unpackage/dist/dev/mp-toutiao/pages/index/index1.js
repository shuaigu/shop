"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "index1",
  setup(__props) {
    const currentDate = common_vendor.ref(/* @__PURE__ */ new Date());
    const selectedDate = common_vendor.ref(null);
    const eventList = common_vendor.ref([]);
    const indexSettings = common_vendor.ref({
      showHomeButton: false,
      homeButtonText: "返回首页",
      homeButtonIcon: "🏠"
    });
    const isLoadingSettings = common_vendor.ref(true);
    const currentYear = common_vendor.computed(() => currentDate.value.getFullYear());
    const currentMonth = common_vendor.computed(() => currentDate.value.getMonth() + 1);
    const daysInMonth = common_vendor.computed(() => {
      const year = currentDate.value.getFullYear();
      const month = currentDate.value.getMonth() + 1;
      return new Date(year, month, 0).getDate();
    });
    const firstDayOfMonth = common_vendor.computed(() => {
      const year = currentDate.value.getFullYear();
      const month = currentDate.value.getMonth();
      return new Date(year, month, 1).getDay();
    });
    const calendarDays = common_vendor.computed(() => {
      const days = [];
      const totalDays = daysInMonth.value;
      const firstDay = firstDayOfMonth.value;
      for (let i = 0; i < firstDay; i++) {
        days.push({
          day: null,
          isCurrentMonth: false,
          hasEvent: false,
          isToday: false
        });
      }
      const today = /* @__PURE__ */ new Date();
      const isCurrentMonthAndYear = today.getFullYear() === currentYear.value && today.getMonth() === currentDate.value.getMonth();
      for (let i = 1; i <= totalDays; i++) {
        const date = new Date(currentYear.value, currentDate.value.getMonth(), i);
        const hasEvent = eventList.value.some((event) => {
          const eventDate = new Date(event.date);
          return eventDate.getDate() === i && eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
        });
        days.push({
          day: i,
          date,
          isCurrentMonth: true,
          hasEvent,
          isToday: isCurrentMonthAndYear && today.getDate() === i,
          isSelected: selectedDate.value && selectedDate.value.getDate() === i && selectedDate.value.getMonth() === date.getMonth() && selectedDate.value.getFullYear() === date.getFullYear()
        });
      }
      return days;
    });
    const goToPreviousMonth = () => {
      const newDate = new Date(currentDate.value);
      newDate.setMonth(newDate.getMonth() - 1);
      currentDate.value = newDate;
    };
    const goToNextMonth = () => {
      const newDate = new Date(currentDate.value);
      newDate.setMonth(newDate.getMonth() + 1);
      currentDate.value = newDate;
    };
    const goToToday = () => {
      currentDate.value = /* @__PURE__ */ new Date();
    };
    const selectDate = (day) => {
      if (day.day === null || !day.isCurrentMonth)
        return;
      selectedDate.value = day.date;
      getEventsForDate(day.date);
    };
    const currentEvents = common_vendor.ref([]);
    const getEventsForDate = (date) => {
      if (!date)
        return;
      setTimeout(() => {
        const events = eventList.value.filter((event) => {
          const eventDate = new Date(event.date);
          return eventDate.getDate() === date.getDate() && eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
        });
        currentEvents.value = events;
      }, 100);
    };
    const newEventTitle = common_vendor.ref("");
    const newEventTime = common_vendor.ref("");
    const showAddEventForm = common_vendor.ref(false);
    const toggleAddEventForm = () => {
      showAddEventForm.value = !showAddEventForm.value;
    };
    const addNewEvent = () => {
      if (!selectedDate.value || !newEventTitle.value)
        return;
      const newEvent = {
        id: Date.now(),
        title: newEventTitle.value,
        date: selectedDate.value,
        time: newEventTime.value,
        completed: false
      };
      eventList.value.push(newEvent);
      currentEvents.value.push(newEvent);
      newEventTitle.value = "";
      newEventTime.value = "";
      showAddEventForm.value = false;
      calendarDays.value.forEach((day) => {
        if (day.date && day.date.getDate() === selectedDate.value.getDate() && day.date.getMonth() === selectedDate.value.getMonth() && day.date.getFullYear() === selectedDate.value.getFullYear()) {
          day.hasEvent = true;
        }
      });
    };
    const initEventData = () => {
      const today = /* @__PURE__ */ new Date();
      const tomorrow = /* @__PURE__ */ new Date();
      tomorrow.setDate(today.getDate() + 1);
      eventList.value = [
        {
          id: 1,
          title: "产品评审会议",
          date: today,
          time: "10:00",
          completed: false
        },
        {
          id: 2,
          title: "客户拜访",
          date: tomorrow,
          time: "14:30",
          completed: false
        },
        {
          id: 3,
          title: "团队周会",
          date: today,
          time: "16:00",
          completed: true
        }
      ];
      selectedDate.value = today;
      getEventsForDate(today);
    };
    const toggleEventCompleted = (event) => {
      event.completed = !event.completed;
    };
    const deleteEvent = (eventId) => {
      eventList.value = eventList.value.filter((event) => event.id !== eventId);
      currentEvents.value = currentEvents.value.filter((event) => event.id !== eventId);
      updateCalendarEvents();
    };
    const updateCalendarEvents = () => {
      calendarDays.value.forEach((day) => {
        if (!day.date)
          return;
        day.hasEvent = eventList.value.some((event) => {
          const eventDate = new Date(event.date);
          return eventDate.getDate() === day.date.getDate() && eventDate.getMonth() === day.date.getMonth() && eventDate.getFullYear() === day.date.getFullYear();
        });
      });
    };
    const getIndexSettings = async () => {
      try {
        isLoadingSettings.value = true;
        const indexYunApi = common_vendor.nr.importObject("indexYun", { customUI: true });
        const result = await indexYunApi.getIndexSettings();
        if (result.code === 0) {
          indexSettings.value = {
            showHomeButton: result.showHomeButton,
            homeButtonText: result.homeButtonText || "返回首页",
            homeButtonIcon: result.homeButtonIcon || "🏠"
          };
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index1.vue:249", "获取首页设置失败:", error);
      } finally {
        isLoadingSettings.value = false;
      }
    };
    const goToIndexPage = () => {
      common_vendor.index.switchTab({
        url: "/pages/index/index"
      });
    };
    common_vendor.onMounted(() => {
      getIndexSettings();
      common_vendor.index.$on("homeButtonChanged", (newState) => {
        indexSettings.value.showHomeButton = newState;
      });
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("homeButtonChanged");
    });
    common_vendor.onMounted(() => {
      initEventData();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(currentYear.value),
        b: common_vendor.t(currentMonth.value),
        c: common_vendor.o(goToPreviousMonth),
        d: common_vendor.o(goToToday),
        e: common_vendor.o(goToNextMonth),
        f: common_vendor.f(calendarDays.value, (day, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(day.day),
            b: day.hasEvent
          }, day.hasEvent ? {} : {}, {
            c: index,
            d: common_vendor.n(!day.isCurrentMonth ? "inactive-day" : ""),
            e: common_vendor.n(day.isToday ? "today" : ""),
            f: common_vendor.n(day.isSelected ? "selected-day" : ""),
            g: common_vendor.n(day.hasEvent ? "has-event" : ""),
            h: common_vendor.o(($event) => selectDate(day))
          });
        }),
        g: common_vendor.t(selectedDate.value ? selectedDate.value.getFullYear() + "年" + (selectedDate.value.getMonth() + 1) + "月" + selectedDate.value.getDate() + "日" : "未选择日期"),
        h: common_vendor.o(toggleAddEventForm),
        i: showAddEventForm.value
      }, showAddEventForm.value ? {
        j: newEventTitle.value,
        k: common_vendor.o(($event) => newEventTitle.value = $event.detail.value),
        l: newEventTime.value,
        m: common_vendor.o(($event) => newEventTime.value = $event.detail.value),
        n: common_vendor.o(toggleAddEventForm),
        o: common_vendor.o(addNewEvent)
      } : {}, {
        p: currentEvents.value.length > 0
      }, currentEvents.value.length > 0 ? {
        q: common_vendor.f(currentEvents.value, (event, k0, i0) => {
          return {
            a: common_vendor.t(event.time),
            b: common_vendor.t(event.title),
            c: common_vendor.t(event.completed ? "已完成" : "完成"),
            d: common_vendor.o(($event) => toggleEventCompleted(event)),
            e: common_vendor.o(($event) => deleteEvent(event.id)),
            f: event.id,
            g: common_vendor.n(event.completed ? "completed-event" : "")
          };
        })
      } : {}, {
        r: indexSettings.value.showHomeButton
      }, indexSettings.value.showHomeButton ? {
        s: common_vendor.t(indexSettings.value.homeButtonIcon),
        t: common_vendor.t(indexSettings.value.homeButtonText),
        v: common_vendor.o(goToIndexPage)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-50a4dea2"]]);
tt.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-toutiao/pages/index/index1.js.map
