"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import defaultImage from "@/assets/image/picture-icon.svg"; // 差し替え
import { ImageBox } from "@/components/imageBox";
import { Button } from "@/components/button";
import { Axios, requestDB } from "@/services/axios";
import tagImage from "@/assets/image/tag.svg"; // 差し替え
import { useParams, useRouter } from "next/navigation";
import { Course, Game, Schedule } from "@/type/models";
import dayjs from "dayjs";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const [courseData, setCourseData] = useState<Course>();
  const animation = useContext(AnimationContext)!;
  const router = useRouter();
  const { gameId, courseId } = useParams()!;
  const courseIdNumber = parseInt(courseId as string);
  const [chosenSchedule, setChosenSchedule] = useState<Date | null>(null);
  const [chosenScheduleData, setChosenScheduleData] = useState<Schedule>();

  const onReady = userData && courseData;

  useEffect(() => {
    fetchCourse();
    animation.startAnimation();
    const scheduleStr = sessionStorage.getItem("chosenSchedule");
    if (scheduleStr) {
      setChosenSchedule(new Date(scheduleStr));
    }
  }, []);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
      if (!chosenSchedule) return;

      const tmpSchedule = courseData.schedules.find((s) =>
        dayjs(s.startTime).isSame(dayjs(chosenSchedule), "minutes")
      );
      if (tmpSchedule?.reservations && tmpSchedule?.reservations.length > 0) {
        alert("すでに予約が入っている時間です");
        router.push(`/courses/course/${courseId}`);
        return;
      }

      setChosenScheduleData(tmpSchedule);
    }
  }, [onReady, chosenSchedule]);

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
        amount: courseData.price,
        userId: userData.id,
        scheduleId: chosenScheduleData?.id,
        courseId,
        courseName: courseData.title,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      window.location.href = data.sessionUrl;
    } else {
      alert("決済エラーが発生しました");
    }
  };

  return (
    <div className="p-courses-purchase l-page">
      {chosenScheduleData ? (
        <>
          <div className="p-courses-purchase__title">選択した講座</div>
          <div className="p-courses-purchase__course">
            <div className="p-courses-purchase__info">
              <div className="p-courses-purchase__info-title">
                {courseData.title}
              </div>
              <div className="p-courses-purchase__info-coach">
                {courseData.coach.name}
              </div>
            </div>
            <div className="p-courses-purchase__info-duration">
              {courseData.duration}分
            </div>
            <div className="p-courses-purchase__info-price">
              ￥{courseData.price.toLocaleString("ja-JP")}
            </div>
          </div>

          <div className="p-courses-purchase__title">受講する日程</div>
          <div className="p-courses-purchase__time">
            {dayjs(chosenScheduleData.startTime).format("YYYY年M月D日　HH:mm~")}
          </div>

          <Button
            className="p-courses-purchase__submit"
            onClick={handlePurchase}
          >
            確定
          </Button>
        </>
      ) : (
        <div>受講日程が選択されていません</div>
      )}
    </div>
  );
};

export default Page;
