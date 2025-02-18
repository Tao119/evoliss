"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { ImageBox } from "@/components/imageBox";
import { Button } from "@/components/button";
import { Axios, requestDB } from "@/services/axios";
import { useParams, useRouter } from "next/navigation";
import { Course, User } from "@/type/models";
import { CourseCard } from "@/app/(login_reuired)/(component)/courseCard";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const [courseData, setCourseData] = useState<Course[]>();
  const [coachData, setCoachData] = useState<User>();
  const animation = useContext(AnimationContext)!;
  const router = useRouter();
  const { coachId } = useParams()!;
  const coachIdNumber = parseInt(coachId as string);

  const onReady = userData && courseData && coachData;

  useEffect(() => {
    fetchCourses();
    fetchCoach();
    animation.startAnimation();
  }, []);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  const fetchCourses = async () => {
    try {
      const response = await requestDB("course", "readCoursesByCoachId", {
        coachId: coachIdNumber,
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
  const fetchCoach = async () => {
    try {
      const response = await requestDB("coach", "readCoachById", {
        id: coachIdNumber,
      });
      if (response.success) {
        setCoachData(response.data);
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

  return (
    <div className="p-courses">
      <div className="p-courses__navigation">
        <div
          className="p-courses__navigation-item -navi"
          onClick={() => router.push("/courses/coach")}
        >
          コーチ一覧
        </div>
        <div className="p-courses__navigation-item">{">"}</div>
        <div className="p-courses__navigation-item">{coachData.name}</div>
      </div>
      <div className="p-courses__title">{`${coachData.name}の講座`}</div>
      <div className="p-courses__list">
        {courseData.map((course) => (
          <CourseCard course={course} />
        ))}
      </div>
    </div>
  );
};

export default Page;
