import React from "react";
import { formatDateTimeRange, formatDateTimeFromSlots } from "@/utils/dateFormatter";

interface CourseInfoDateTimeProps {
  // パターン1: 開始日時と期間（分）を指定
  startDateTime?: string;
  duration?: number;
  
  // パターン2: タイムスロットの配列を指定
  timeSlots?: Array<{ dateTime: string }>;
  
  className?: string;
}

export const CourseInfoDateTime: React.FC<CourseInfoDateTimeProps> = ({ 
  startDateTime, 
  duration,
  timeSlots,
  className = ""
}) => {
  let dateTimeInfo = { date: "", time: "" };
  
  if (startDateTime && duration) {
    dateTimeInfo = formatDateTimeRange(startDateTime, duration);
  } else if (timeSlots) {
    dateTimeInfo = formatDateTimeFromSlots(timeSlots);
  }
  
  if (!dateTimeInfo.date) {
    return null;
  }
  
  return (
    <div className={`p-course-info__datetime ${className}`}>
      <div className="p-course-info__datetime-date">
        {dateTimeInfo.date}
      </div>
      <div className="p-course-info__datetime-time">
        {dateTimeInfo.time}
      </div>
    </div>
  );
};
