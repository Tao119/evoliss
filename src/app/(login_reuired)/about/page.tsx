"use client";
import { useState, useEffect, useContext } from "react";
import { requestDB } from "@/services/axios";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import profileIcon from "@/assets/image/logo.png";
import downIcon from "@/assets/image/arrow_down.png";
import { GameCard } from "../(component)/gameCard";
import { Course, Game, User } from "@/type/models";
import { CoachCard } from "../(component)/coachCard";
import { CourseCard } from "../(component)/courseCard";
import { useRouter } from "next/navigation";

const Page = () => {
  const { userData } = useContext(UserDataContext)!;
  const animation = useContext(AnimationContext)!;
  const router = useRouter();

  const [games, setGames] = useState<Game[]>();
  const [coaches, setCoaches] = useState<User[]>();
  const [courses, setCourses] = useState<Course[]>();

  const onReady = games && coaches && courses && userData;

  useEffect(() => {
    animation.startAnimation();
    fetchGames();
    fetchCoaches();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  const fetchGames = async () => {
    try {
      const response = await requestDB("game", "readTopGames");
      if (response.success) {
        setGames(response.data);
      } else {
        animation.endAnimation();
        alert("ゲーム情報の取得中にエラーが発生しました");
      }
    } catch (error) {
      console.error("Error fetching games:", error);
    }
  };

  const fetchCoaches = async () => {
    try {
      const response = await requestDB("coach", "readTopCoaches");
      if (response.success) {
        setCoaches(response.data);
      } else {
        animation.endAnimation();
        alert("コーチ情報の取得中にエラーが発生しました");
      }
    } catch (error) {
      console.error("Error fetching coaches:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await requestDB("course", "readTopCourses");
      if (response.success) {
        setCourses(response.data);
      } else {
        animation.endAnimation();
        alert("コース情報の取得中にエラーが発生しました");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  if (!onReady) {
    return <>Loading...</>;
  }

  return (
    <div className="p-about">
      <div className="p-about__top-panel">
        <div className="p-about__top-panel-left">
          <div className="p-about__top-panel-title">GAME MASTERSとは</div>
          <div className="p-about__top-panel-phrase-container">
            <div className="p-about__top-panel-phrase">新たなステージに</div>
            <div className="p-about__top-panel-phrase">私たちとチャレンジ</div>
          </div>
          <div className="p-about__top-panel-button-wrapper">
            <Button className="p-about__top-panel-button">続きを見る</Button>
          </div>
        </div>
        <ImageBox className="p-about__top-panel-right" src={profileIcon} />
      </div>

      <div className="p-about__coach-panel">
        <div className="p-about__section-title">コーチから探す</div>
        <div className="p-about__coach-list">
          {coaches.map((coach, i) => (
            <CoachCard key={i} coach={coach} />
          ))}
        </div>

        <ImageBox
          className="p-about__more"
          src={downIcon}
          onClick={() => router.push("/courses/coach")}
        />
      </div>

      <div className="p-about__course-panel">
        <div className="p-about__section-title">人気な講座</div>
        <div className="p-about__course-list">
          {courses.map((course, i) => (
            <CourseCard key={i} course={course} />
          ))}
        </div>{" "}
        <ImageBox
          className="p-about__more"
          src={downIcon}
          onClick={() => router.push("/courses")}
        />
      </div>

      <div className="p-about__game-panel">
        <div className="p-about__section-title">ゲームから探す</div>
        <div className="p-about__game-list">
          {games.map((game, i) => (
            <GameCard key={i} game={game} />
          ))}
        </div>{" "}
        <ImageBox
          className="p-about__more"
          src={downIcon}
          onClick={() => router.push("/courses/game")}
        />
      </div>
    </div>
  );
};

export default Page;
