"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import defaultImage from "@/assets/image/picture-icon.svg"; // 差し替え
import { ImageBox } from "@/components/imageBox";
import { Button } from "@/components/button";
import { Axios, requestDB } from "@/services/axios";
import tagImage from "@/assets/image/tag.svg"; // 差し替え
import { useParams, useRouter } from "next/navigation";
import { Course, Game } from "@/type/models";
import { CourseCard } from "@/app/(login_required)/(component)/courseCard";
import Calendar, {
  CalendarTarget,
} from "@/app/(login_required)/(component)/calender";
import StarRating from "@/components/starRating";
import dayjs from "dayjs";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const [courseData, setCourseData] = useState<Course>();
  const [recommendedCourseData, setRecommendedCourseData] =
    useState<Course[]>();
  const animation = useContext(AnimationContext)!;
  const router = useRouter();
  const { courseId } = useParams()!;
  const courseIdNumber = parseInt(courseId as string);

  const [chosenSchedule, setChosenSchedule] = useState<Date>();

  const onReady = userData && courseData && recommendedCourseData;

  useEffect(() => {
    fetchCourse();
    fetchRecommendedCourse();
    animation.startAnimation();
  }, []);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
      requestDB("access", "createAccess", {
        userId: userData.id,
        courseId: courseIdNumber,
      });
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

  const fetchRecommendedCourse = async () => {
    try {
      const response = await requestDB("course", "readRecommendedCourses", {
        urId: userData?.id,
        courseId: courseIdNumber,
      });
      if (response.success) {
        setRecommendedCourseData(response.data);
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

  const averageRating: number =
    coach.courses &&
    coach.courses.length > 0 &&
    coach.courses.reduce(
      (totalCount, course) =>
        totalCount + (course.reviews ? course.reviews.length : 0),
      0
    ) != 0
      ? coach.courses.reduce(
          (totalScore, course) =>
            totalScore +
            (course.reviews
              ? course.reviews.reduce((sum, review) => sum + review.rating, 0)
              : 0),
          0
        ) /
        coach.courses.reduce(
          (totalCount, course) =>
            totalCount + (course.reviews ? course.reviews.length : 0),
          0
        )
      : 0;

  const updateChosenSchedule = (s: Date | undefined) => {
    setChosenSchedule((prev) =>
      dayjs(s).isSame(dayjs(prev), "minutes") ? undefined : s
    );
  };

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
        <div
          className="p-courses__navigation-item -navi"
          onClick={() => router.push(`/courses/coach/${courseData.coachId}`)}
        >
          {courseData.coach.name}
        </div>
        <div className="p-courses__navigation-item">{">"}</div>
        <div className="p-courses__navigation-item">{courseData.title}</div>
      </div>
      <div className="p-course">
        <div className="p-course__content">
          <ImageBox
            src={courseData.image ?? defaultImage}
            className="p-course__image"
            objectFit="cover"
          />
          <div className="p-course__title">{`${courseData.title}`}</div>

          <div className="p-course__section">
            <div className="p-course__subtitle">講座の内容</div>
            <div className="p-course__description">
              {courseData.description}
            </div>
          </div>
          <div className="p-course__section">
            <div className="p-course__subtitle">日程調整</div>
            <Calendar
              duration={courseData.duration}
              schedule={courseData.schedules
                .filter(
                  (s) =>
                    s.reservations.length == 0 &&
                    new Date(s.startTime) >= new Date()
                )
                .map((s) => new Date(s.startTime))}
              target={CalendarTarget.viewer}
              setChosenSchedule={updateChosenSchedule}
              chosenSchedule={chosenSchedule}
            />
          </div>
        </div>
        <div className="p-course__info">
          <div className="p-course__info-price">
            <div className="p-course__price">
              ¥{courseData.price.toLocaleString("ja-JP")}
            </div>
            {userData.id != courseData.coachId && (
              <>
                <Button
                  className="p-course__info-button"
                  onClick={() =>
                    router.push(`/courses/course/${courseId}/message`)
                  }
                >
                  個人メッセージ
                </Button>
                <Button
                  className="p-course__info-button"
                  onClick={() => {
                    if (!chosenSchedule) {
                      alert("日程を選択してください");
                      return;
                    }
                    sessionStorage.setItem(
                      "chosenSchedule",
                      chosenSchedule.toISOString()
                    );
                    router.push(`/courses/course/${courseId}/purchase`);
                    router.push(`/courses/course/${courseId}/purchase`);
                  }}
                >
                  購入
                </Button>
              </>
            )}
          </div>
          <div key={coach.id} className="p-course__coach-item">
            <div className="p-course__coach-upper">
              <ImageBox
                className="p-course__coach-icon"
                src={coach.icon ?? defaultImage}
                objectFit="cover"
                round
              />
              <div className="p-course__coach-details">
                <div className="p-course__coach-name">{coach.name}</div>
                <div className="p-course__coach-rating">
                  <StarRating
                    score={averageRating}
                    showsScore={false}
                    className="p-course__coach-stars"
                  />
                  <div className="p-course__coach-rating-text">
                    (
                    {coach.courses.reduce(
                      (total, course) => total + (course.reviews?.length || 0),
                      0
                    )}
                    )
                  </div>
                </div>
              </div>
            </div>
            <div className="p-course__coach-games">
              <ImageBox className="p-course__coach-tag-icon" src={tagImage} />
              <div className="p-course__coach-game-list">
                {coach.userGames.slice(0, 4).map((game) => (
                  <div key={game.id} className="p-course__coach-game">
                    {game.game.name}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-course__coach-bio">
              <div className="p-course__coach-bio-title">自己紹介</div>
              <div className="p-course__coach-bio-content">
                {coach.bio?.split("\n").map((line, idx) => (
                  <div key={idx}>
                    {line}
                    <br />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-courses__title">{`おすすめの講座`}</div>
      <div className="p-courses__list -wrap">
        {recommendedCourseData.map((course) => (
          <CourseCard course={course} key={course.id} />
        ))}
      </div>
    </div>
  );
};

export default Page;
