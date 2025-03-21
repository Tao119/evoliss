"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { ImageBox } from "@/components/imageBox";
import { Button } from "@/components/button";
import { Axios, requestDB } from "@/services/axios";
import { useParams, useRouter } from "next/navigation";
import { Course, User } from "@/type/models";
import { CourseCard } from "@/app/(component)/courseCard";
import { Pagination } from "@/components/pagination";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const [coachData, setCoachData] = useState<User>();
  const animation = useContext(AnimationContext)!;
  const router = useRouter();
  const { coachId } = useParams()!;
  const coachIdNumber = parseInt(coachId as string);

  const [currentPage, setCurrentPage] = useState(1);
  const [courseData, setCourseData] = useState<{ [page: number]: Course[] }>(
    {}
  );
  const [courseNum, setCourseNum] = useState(0);
  const total = 10;

  const onReady = courseData && coachData;

  useEffect(() => {
    fetchCoursesNum();
    fetchCoach();
    animation.startAnimation();
  }, []);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  useEffect(() => {
    if (Object.keys(courseData).includes(currentPage.toString())) {
      return;
    }
    animation.startAnimation();
    fetchCourses();
  }, [currentPage]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchCourses();
      fetchCoach();
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchCoursesNum = async () => {
    try {
      const response = await requestDB("course", "readCoursesNumByCoachId", {
        coachId: coachIdNumber,
      });
      if (response.success) {
        setCourseNum(response.data);
      } else {
        alert("コース情報の取得中にエラーが発生しました");
      }
      animation.endAnimation();
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await requestDB("course", "readCoursesByCoachId", {
        coachId: coachIdNumber,
        page: currentPage,
        total,
      });
      if (response.success) {
        setCourseData((prev) => ({ ...prev, [currentPage]: response.data }));
        animation.endAnimation();
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
    <div className="p-courses l-page">
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
      <div className="p-courses__sub-title">{`全${courseNum}件中${
        total * (currentPage - 1) + 1
      }~${Math.min(total * currentPage, courseNum)}件を表示`}</div>
      <div className="p-courses__list">
        {courseData[currentPage] &&
          courseData[currentPage].map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
      </div>
      <div className="p-courses__pagination">
        <Pagination
          all={courseNum}
          total={total}
          page={currentPage}
          updatePage={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default Page;
