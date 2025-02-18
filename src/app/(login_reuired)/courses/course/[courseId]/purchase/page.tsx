"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import defaultImage from "@/assets/image/picture-icon.svg"; // 差し替え
import { ImageBox } from "@/components/imageBox";
import { Button } from "@/components/button";
import { Axios, requestDB } from "@/services/axios";
import tagImage from "@/assets/image/tag.png"; // 差し替え
import { useParams, useRouter } from "next/navigation";
import { Course, Game } from "@/type/models";
import StarRating from "@/components/starRating";
import Calendar, {
  CalendarTarget,
} from "@/app/(login_reuired)/(component)/calender";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const [courseData, setCourseData] = useState<Course>();
  const [scheduleIds, setScheduleIds] = useState<number[]>([]);
  const animation = useContext(AnimationContext)!;
  const router = useRouter();
  const { gameId, courseId } = useParams()!;
  const courseIdNumber = parseInt(courseId as string);

  const onReady = userData && courseData;

  useEffect(() => {
    fetchCourse();
    animation.startAnimation();
  }, []);

  useEffect(() => {
    if (!courseData) return;
    setScheduleIds(courseData.schedules.slice(0, 2).map((s) => s.id));
  }, [courseData]);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  const fetchCourse = async () => {
    try {
      const response = await requestDB("course", "readCourseById", {
        id: courseIdNumber,
      });
      if (response.success) {
        setCourseData(response.data);
      } else {
        animation.endAnimation();
        alert("コース情報の取得中にエラーが発生しました");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  if (!onReady) {
    return <div>Loading...</div>;
  }

  const coach = courseData?.coach;

  const handlePurchase = async () => {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: courseData.price * scheduleIds.length,
        userId: userData.id, // ユーザーID
        scheduleIds,
        courseId,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      window.location.href = data.sessionUrl; // Checkoutページへ遷移
    } else {
      alert("決済エラーが発生しました");
    }
  };

  return (
    <div className="p-courses-purchase">
      <div className="p-courses-purchase__title">選択した講座</div>
      <div className="p-courses-purchase__course">
        <div className="p-courses-purchase__info">
          <div className="p-courses-purchase__course">{courseData.title}</div>
          <div className="p-courses-purchase__course">
            {courseData.coach.name}
          </div>
        </div>
        <div className="p-courses-purchase__course">
          {courseData.duration}分
        </div>
        <div className="p-courses-purchase__course">￥{courseData.price}</div>
      </div>

      <div className="p-courses-purchase__title">受講する日程</div>
      <Calendar
        duration={courseData.duration}
        schedule={courseData.schedules.map((s) => new Date(s.startTime))}
        target={CalendarTarget.viewer}
      />
      <Button onClick={handlePurchase} />
    </div>
  );
};

export default Page;
