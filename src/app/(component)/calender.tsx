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
  const [prevSelectIndex, setPrevSelectIndex] = useState<number | undefined>(
    undefined
  );

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
          .second(0)
          .millisecond(0)
          .add(i * 30, "minute")
          .toDate();
      }).filter((slot) => {
        return !schedule.some((s) => {
          return dayjs(slot).isSame(dayjs(s), "minute");
        });
      })
    );
  }, [schedule, selectedDate]);

  useEffect(() => {
    let num = prevSelectIndex;
    if (!num) {
      setSelectedSchedule(timeSlots[0]);
      return;
    }
    while (num >= timeSlots.length) {
      num--;
    }
    setSelectedSchedule(timeSlots[num]);
  }, [selectedDate, timeSlots]);

  useEffect(() => {
    if (selectedSchedule != undefined) {
      const newIndex = timeSlots.findIndex((s) => {
        return s.getTime() == selectedSchedule.getTime();
      });
      if (newIndex != prevSelectIndex) {
        setPrevSelectIndex(newIndex);
      }
    }
  }, [selectedSchedule]);

  const addToSchedule = () => {
    if (!setSchedule || !selectedSchedule) return;
    if (schedule.some((s) => selectedSchedule.getTime() === s.getTime())) {
      return;
    }
    setSchedule((prev) => [...prev, selectedSchedule]);
  };
  const removeFromSchedule = (time: number) => {
    if (!setSchedule) return;
    const newSchedule = [...schedule].filter((s) => s.getTime() != time);

    setSchedule(newSchedule);
  };
  return (
    <div className={`p-calendar`}>
      <div
        className={`p-calendar__upper ${
          target != CalendarTarget.editor ? "-customer" : ""
        }`}
      >
        <div
          className={`p-calendar__calender ${
            target != CalendarTarget.editor ? "-customer" : ""
          }`}
        >
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
        <div
          className={`p-calendar__selected-date ${
            target != CalendarTarget.editor ? "-customer" : ""
          }`}
        >
          <div
            className={`p-calendar__selected-current ${
              target != CalendarTarget.editor ? "-customer" : ""
            }`}
          >
            <div className="p-calendar__current-year">
              {dayjs(selectedDate).format("YYYY")}
            </div>
            <div className="p-calendar__current-date">
              {dayjs(selectedDate).format("M月D日")}
            </div>
          </div>
          <div
            className={`p-calendar__selected-list ${
              target != CalendarTarget.editor ? "-customer" : ""
            }`}
          >
            {schedule
              .filter((s) => dayjs(selectedDate).isSame(dayjs(s), "day"))
              .sort((a, b) => (a.getTime() > b.getTime() ? 1 : -1))
              .map((s, i) => (
                <div
                  className={`p-calendar__selected-schedule ${
                    target != CalendarTarget.editor ? "-customer" : ""
                  }`}
                  key={i}
                >
                  <div
                    className={`p-calendar__selected-schedule-schedule ${
                      dayjs(chosenSchedule).isSame(s, "minutes")
                        ? "-active"
                        : ""
                    }  ${target != CalendarTarget.editor ? "-customer" : ""}`}
                    onClick={() => {
                      setChosenSchedule && setChosenSchedule(s);
                    }}
                  >
                    ・{dayjs(s).format("H:mm")}~
                  </div>
                  {target == CalendarTarget.editor ? (
                    <div
                      className="p-calendar__selected-schedule-delete"
                      onClick={() => removeFromSchedule(s.getTime())}
                    >
                      ×
                    </div>
                  ) : null}
                </div>
              ))}
          </div>
        </div>
      </div>
      {target == CalendarTarget.editor ? (
        <div className="p-calendar__selected-date-input">
          <Filter
            selectedValue={selectedSchedule}
            className="p-calendar__filter"
            options={timeSlots.map((slot) => {
              return { label: `${dayjs(slot).format("H:mm")}~`, value: slot };
            })}
            onChange={(value: any) => {
              setSelectedSchedule(new Date(value));
            }}
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
