"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { ImageBox } from "@/components/imageBox";
import { Button } from "@/components/button";
import { Axios, requestDB } from "@/services/axios";
import rightIcon from "@/assets/image/arrow_right.svg";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Course, Game, User } from "@/type/models";
import { CourseCard } from "@/app/(component)/courseCard";
import { CoachCard } from "@/app/(component)/coachCard";
import { GameCard } from "@/app/(component)/gameCard";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const [courseData, setCourseData] = useState<Course[]>();
  const [gameData, setGameData] = useState<Game[]>();
  const [coachData, setCoachData] = useState<User[]>();
  const animation = useContext(AnimationContext)!;
  const router = useRouter();

  const param = useSearchParams()!;
  const query = param.get("query");

  const onReady = query && courseData && gameData && coachData;

  useEffect(() => {
    animation.startAnimation();
    fetchCourses();
    fetchGames();
    fetchCoaches();
  }, [query]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchCourses();
      fetchCoaches();
      fetchGames();
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);
  const fetchCourses = async () => {
    try {
      const response = await requestDB("course", "readCoursesByQuery", {
        query,
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
  const fetchGames = async () => {
    try {
      const response = await requestDB("game", "readGamesByQuery", {
        query,
      });
      if (response.success) {
        setGameData(response.data);
      } else {
        animation.endAnimation();
        alert("ゲーム情報の取得中にエラーが発生しました");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };
  const fetchCoaches = async () => {
    try {
      const response = await requestDB("coach", "readCoachesByQuery", {
        query,
      });
      console.log(response);
      if (response.success) {
        setCoachData(response.data);
      } else {
        animation.endAnimation();
        alert("コーチ情報の取得中にエラーが発生しました");
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
      {courseData.length == 0 &&
        coachData.length == 0 &&
        gameData.length == 0 && (
          <div className="p-courses__title">検索結果がありませんでした。</div>
        )}
      {courseData.length > 0 && (
        <>
          <div className="p-courses__title">{`"${query}"でヒットした講座`}</div>
          <div className="p-courses__list">
            {courseData.map((course) => (
              <CourseCard course={course} />
            ))}
          </div>
        </>
      )}
      {coachData.length > 0 && (
        <>
          <div className="p-courses__title">{`"${query}"でヒットしたコーチ`}</div>
          <div className="p-courses__list">
            {coachData.map((coach) => (
              <CoachCard coach={coach} />
            ))}
          </div>{" "}
        </>
      )}{" "}
      {gameData.length > 0 && (
        <>
          <div className="p-courses__title">{`"${query}"でヒットしたゲーム`}</div>
          <div className="p-courses__list">
            {gameData.map((game) => (
              <GameCard game={game} />
            ))}
          </div>{" "}
        </>
      )}
    </div>
  );
};

export default Page;
