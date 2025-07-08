import dayjs from "dayjs";
import "dayjs/locale/ja";

dayjs.locale("ja");

export const formatDateTimeRange = (startDateTime: string, duration: number) => {
  const start = dayjs(startDateTime);
  const end = start.add(duration, "minute");
  
  return {
    date: start.format("YYYY年MM月DD日（ddd）"),
    time: `${start.format("HH:mm")}~${end.format("HH:mm")}`
  };
};

export const formatDateTimeFromSlots = (timeSlots: Array<{ dateTime: string }>) => {
  if (!timeSlots || timeSlots.length === 0) {
    return {
      date: "",
      time: ""
    };
  }
  
  const firstSlot = dayjs(timeSlots[0].dateTime);
  const lastSlot = dayjs(timeSlots[timeSlots.length - 1].dateTime);
  
  // 30分スロットと仮定して終了時間を計算
  const endTime = lastSlot.add(30, "minute");
  
  return {
    date: firstSlot.format("YYYY年MM月DD日（ddd）"),
    time: `${firstSlot.format("HH:mm")}~${endTime.format("HH:mm")}`
  };
};
