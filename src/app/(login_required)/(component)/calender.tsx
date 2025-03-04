"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/button";
import { Filter } from "@/components/filter";
import { IconButton } from "@/components/iconButton";
import plusIcon from "@/assets/image/plus_white.svg";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

export enum CalendarTarget {
  editor,
  viewer,
  customer,
}

interface CalendarProps {
  schedule: Date[];
  setSchedule?: Dispatch<SetStateAction<Date[]>>;
  target: CalendarTarget;
  duration: number;
  chosenSchedule?: Date | undefined;
  setChosenSchedule?: (_: Date | undefined) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  schedule,
  setSchedule,
  duration,
  target,
  chosenSchedule,
  setChosenSchedule,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const handlePrevMonth = () =>
    setCurrentMonth(currentMonth.subtract(1, "month"));
  const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));

  useEffect(() => {
    const today = dayjs();
    if (currentMonth.isSame(today, "month")) {
      setSelectedDate(today.toDate());
    } else {
      setSelectedDate(currentMonth.startOf("month").toDate());
    }
  }, [currentMonth, setSelectedDate]);

  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.startOf("month").day();

  const dates: Array<dayjs.Dayjs | null> = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => currentMonth.date(i + 1)),
  ];

  const [timeSlots, setTimeSlots] = useState<Date[]>([]);

  const [selectedSchedule, setSelectedSchedule] = useState(
    timeSlots.length > 0 ? new Date(timeSlots[0]) : undefined
  );

  useEffect(() => {
    setTimeSlots(
      Array.from({ length: 48 }, (_, i) => {
        return dayjs(selectedDate)
          .hour(0)
          .minute(0)
          .add(i * 30, "minute")
          .toDate();
      }).filter((slot) => {
        return !schedule.some((s) => {
          const startTime = dayjs(s);
          const endTime = startTime.add(duration, "minute");
          const beforeTime = startTime.add(-duration, "minute");
          return dayjs(slot).isBetween(beforeTime, endTime, "minute", "[)");
        });
      })
    );
  }, [schedule, selectedDate]);

  useEffect(() => setSelectedSchedule(timeSlots[0]), [selectedDate, timeSlots]);

  useEffect(() => {
    if (!setSchedule || schedule.length === 0) return;

    const sortedSchedule = [...schedule].sort(
      (a, b) => dayjs(a).valueOf() - dayjs(b).valueOf()
    );

    const filteredSchedule: Date[] = [];
    let lastAddedTime: dayjs.Dayjs | null = null;

    sortedSchedule.forEach((s) => {
      const currentTime = dayjs(s);

      if (
        !lastAddedTime ||
        currentTime.diff(lastAddedTime, "minute") >= duration
      ) {
        filteredSchedule.push(currentTime.toDate());
        lastAddedTime = currentTime;
      }
    });

    setSchedule(filteredSchedule);
  }, [duration]);

  const addToSchedule = () => {
    if (!setSchedule || !selectedSchedule) return;
    if (schedule.some((s) => selectedSchedule.getTime() === s.getTime())) {
      return;
    }
    setSchedule((prev) => [...prev, selectedSchedule]);
  };
  return (
    <div className={`p-calendar`}>
      <div className="p-calendar__upper">
        <div className="p-calendar__calender">
          <div className="p-calendar__header">
            <div className="p-calendar__current">
              <div className="p-calendar__current-year">
                {currentMonth.format("YYYY")}
              </div>
              <div className="p-calendar__current-month">
                {currentMonth.format("M月")}
              </div>
            </div>
            <div className="p-calendar__buttons">
              <Button className="p-calendar__button" onClick={handlePrevMonth}>
                {"<"}
              </Button>
              <Button className="p-calendar__button" onClick={handleNextMonth}>
                {">"}
              </Button>
            </div>
          </div>
          <div className="p-calendar__grid">
            {["日", "月", "火", "水", "木", "金", "土"].map((day, idx) => (
              <div
                key={day}
                className={`p-calendar__day ${
                  dates[idx] == null ? "-null" : ""
                }`}
              >
                {day}
              </div>
            ))}
            {dates.map((date, idx) => (
              <div
                key={idx}
                className={`p-calendar__date ${
                  dayjs(selectedDate).isSame(date, "day") ? "-active" : ""
                } ${
                  date && (idx % 7 == 0 || !dates[idx - 1])
                    ? "-first-column"
                    : ""
                } ${date && idx >= 7 && !dates[idx - 7] ? "-first-row" : ""} ${
                  !date ? "-null" : ""
                }`}
                onClick={() => date && setSelectedDate(date.toDate())}
              >
                {date ? date.date() : ""}
                {date && schedule.some((d) => dayjs(d).isSame(date, "day")) && (
                  <span className="p-calendar__circle"></span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="p-calendar__selected-date-customer">
          <div className="p-calendar__selected-current">
            <div className="p-calendar__current-year">
              {dayjs(selectedDate).format("YYYY")}
            </div>
            <div className="p-calendar__current-date">
              {dayjs(selectedDate).format("M月D日")}
            </div>
          </div>
          {schedule
            .filter((s) => dayjs(selectedDate).isSame(dayjs(s), "day"))
            .sort((a, b) => (a.getTime() > b.getTime() ? 1 : -1))
            .map((s, i) => (
              <div
                key={i}
                className={`p-calendar__selected-schedule ${
                  dayjs(chosenSchedule).isSame(s, "minutes") ? "-active" : ""
                }`}
                onClick={() => {
                  setChosenSchedule && setChosenSchedule(s);
                }}
              >
                ・{dayjs(s).format("H:mm")}~
              </div>
            ))}
        </div>
      </div>
      {target == CalendarTarget.editor ? (
        <div className="p-calendar__selected-date">
          <Filter
            selectedValue={selectedSchedule}
            className="p-calendar__filter"
            options={timeSlots.map((slot) => {
              return { label: `${dayjs(slot).format("H:mm")}~`, value: slot };
            })}
            onChange={(value: any) => setSelectedSchedule(new Date(value))}
          />
          <IconButton
            className="p-calendar__plus"
            src={plusIcon}
            onClick={addToSchedule}
          />
        </div>
      ) : null}
    </div>
  );
};

export default Calendar;
