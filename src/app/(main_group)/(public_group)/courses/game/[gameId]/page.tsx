"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { ImageBox } from "@/components/imageBox";
import { Button } from "@/components/button";
import { Axios, requestDB } from "@/services/axios";
import { useParams, useRouter } from "next/navigation";
import { Course, Game } from "@/type/models";
import { CourseCard } from "@/app/(component)/courseCard";
import { Pagination } from "@/components/pagination";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const [gameData, setGameData] = useState<Game>();
  const animation = useContext(AnimationContext)!;
  const router = useRouter();
  const { gameId } = useParams()!;
  const gameIdNumber = parseInt(gameId as string);

  const [currentPage, setCurrentPage] = useState(1);
  const [courseData, setCourseData] = useState<{ [page: number]: Course[] }>(
    {}
  );
  const [courseNum, setCourseNum] = useState(0);
  const total = 10;

  const onReady = courseData && gameData;

  useEffect(() => {
    fetchCoursesNum();
    fetchGame();
    animation.startAnimation();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchCourses();
      fetchGame();
    }, 60 * 1000);

    return () => clearInterval(intervalId);
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
      fetchGame();
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchCoursesNum = async () => {
    try {
      const response = await requestDB("course", "readCoursesNumByGameId", {
        gameId: gameIdNumber,
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
      const response = await requestDB("course", "readCoursesByGameId", {
        gameId: gameIdNumber,
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
  const fetchGame = async () => {
    try {
      const response = await requestDB("game", "readGameById", {
        id: gameIdNumber,
      });
      if (response.success) {
        setGameData(response.data);
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
          onClick={() => router.push("/courses/game")}
        >
          ゲーム一覧
        </div>
        <div className="p-courses__navigation-item">{">"}</div>
        <div className="p-courses__navigation-item">{gameData.name}</div>
      </div>
      <div className="p-courses__title">{`${gameData.name}の講座`}</div>
      <div className="p-courses__sub-title">{`全${courseNum}件中${
        total * (currentPage - 1) + 1
      }~${Math.min(total * currentPage, courseNum)}件を表示`}</div>
      <div className="p-courses__list">
        {courseData[currentPage] &&
          courseData[currentPage].map((course) => (
            <CourseCard course={course} />
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
