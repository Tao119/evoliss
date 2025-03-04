"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { ImageBox } from "@/components/imageBox";
import { Button } from "@/components/button";
import { Axios, requestDB } from "@/services/axios";
import { useParams, useRouter } from "next/navigation";
import { Course, Game } from "@/type/models";
import { CourseCard } from "@/app/(component)/courseCard";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const [courseData, setCourseData] = useState<Course[]>();
  const [gameData, setGameData] = useState<Game>();
  const animation = useContext(AnimationContext)!;
  const router = useRouter();
  const { gameId } = useParams()!;
  const gameIdNumber = parseInt(gameId as string);

  const onReady = courseData && gameData;

  useEffect(() => {
    fetchCourses();
    fetchGame();
    animation.startAnimation();
  }, []);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  const fetchCourses = async () => {
    try {
      const response = await requestDB("course", "readCoursesByGameId", {
        gameId: gameIdNumber,
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
      <div className="p-courses__list">
        {courseData.map((course) => (
          <CourseCard course={course} />
        ))}
      </div>
    </div>
  );
};

export default Page;
