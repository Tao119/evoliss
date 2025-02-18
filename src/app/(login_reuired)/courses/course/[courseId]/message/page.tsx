"use client";

import { useEffect, useState, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import { requestDB } from "@/services/axios";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { ImageBox } from "@/components/imageBox";
import { MultilineInput } from "@/components/multilineInput";
import { Button } from "@/components/button";
import defaultIcon from "@/assets/image/user-icon.png";
import StarRating from "@/components/starRating";
import { MessageRoom } from "@prisma/client";
import { Course, User } from "@/type/models";

const CourseMessagePage = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const { courseId } = useParams()!;
  const router = useRouter();
  const animation = useContext(AnimationContext)!;
  const [course, setCourse] = useState<Course>();

  const [content, setContent] = useState("");

  const onReady = userData && course;

  useEffect(() => {
    fetchCourse();
    fetchRoom();
    animation.startAnimation();
  }, [courseId, userData]);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  const fetchRoom = async () => {
    if (!userData) return;

    try {
      const response = await requestDB("message", "readRoomByUserAndCourseId", {
        userId: userData.id,
        courseId: parseInt(courseId as string),
      });
      if (response.success) {
        if (response.data && response.data.roomKey) {
          router.push(`/message/${response.data.roomKey}`);
        }
      } else {
        animation.endAnimation();
        alert("チャットルームの取得に失敗しました");
      }
    } catch (error) {
      console.error("Error fetching message room:", error);
      animation.endAnimation();
    }
  };
  const fetchCourse = async () => {
    if (!userData) return;

    try {
      const response = await requestDB("course", "readCourseById", {
        id: parseInt(courseId as string),
      });
      if (response.success) {
        setCourse(response.data);
      } else {
        animation.endAnimation();
        alert("コースの取得に失敗しました");
      }
    } catch (error) {
      console.error("Error fetching message room:", error);
      animation.endAnimation();
    }
  };

  const sendMessage = async () => {
    if (!content.trim() || !userData) return;

    try {
      animation.startAnimation();
      const response = await requestDB("message", "sendFirstMessage", {
        userId: userData.id,
        courseId: parseInt(courseId as string),
        content,
      });

      if (response.success) {
        if (response.data.roomKey) {
          fetchUserData();
          router.push(`/message/${response.data.roomKey}`);
        }
      } else {
        animation.endAnimation();
        alert("メッセージの送信に失敗しました");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!onReady) {
    return <div>Loading...</div>;
  }
  const averageRating: number =
    course.coach.courses &&
    course.coach.courses.length > 0 &&
    course.coach.courses.reduce(
      (totalCount, course) =>
        totalCount + (course.reviews ? course.reviews.length : 0),
      0
    ) != 0
      ? course.coach.courses.reduce(
          (totalScore, course) =>
            totalScore +
            (course.reviews
              ? course.reviews.reduce((sum, review) => sum + review.rating, 0)
              : 0),
          0
        ) /
        course.coach.courses.reduce(
          (totalCount, course) =>
            totalCount + (course.reviews ? course.reviews.length : 0),
          0
        )
      : 0;

  return (
    <div className="p-message-room">
      <div className="p-message-room__title">メッセージ</div>
      <div className="p-message-room__coach">
        <ImageBox
          className="p-message-room__coach-icon"
          src={course.coach.icon ?? defaultIcon}
          objectFit="cover"
          round
        />
        <div className="p-message-room__coach-details">
          <div className="p-message-room__coach-name">
            {`${course.coach.name} (${course.title})`}
          </div>
          <div className="p-message-room__coach-rating">
            <StarRating
              score={averageRating}
              showsScore={false}
              className="p-message-room__coach-stars"
            />
            <div className="p-message-room__coach-rating-text">
              (
              {course.coach.courses.reduce(
                (total, course) => total + (course.reviews?.length || 0),
                0
              )}
              )
            </div>
          </div>
        </div>
      </div>
      <div className="p-message-room__messages"></div>
      <MultilineInput
        className="p-message-room__input"
        placeholder="メッセージを入力"
        value={content}
        minHeight={80}
        maxHeight={80}
        onChange={(e) => setContent(e.target.value)}
        onEnter={sendMessage}
      ></MultilineInput>
      <Button
        inactive={content.trim() === ""}
        className={`p-message-room__submit ${
          content.trim() !== "" ? "-active" : ""
        }`}
        onClick={sendMessage}
      >
        送信
      </Button>
    </div>
  );
};

export default CourseMessagePage;
