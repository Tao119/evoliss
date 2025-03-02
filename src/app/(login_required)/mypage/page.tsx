"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { ImageBox } from "@/components/imageBox";
import { Button } from "@/components/button";
import defaultIcon from "@/assets/image/user_icon.svg";
import plusImage from "@/assets/image/plus.svg";
import defaultHeader from "@/assets/image/blue.png";
import editIcon from "@/assets/image/edit.svg";
import { Axios, requestDB } from "@/services/axios";
import StarRating from "@/components/starRating";
import { CourseCard } from "../(component)/courseCard";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/iconButton";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const animation = useContext(AnimationContext)!;
  const router = useRouter();

  const headerInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(userData?.name || "");
  const [selectedMenu, setSelectedMenu] = useState("profile");

  const onReady = userData;

  useEffect(() => {
    animation.startAnimation();
  }, []);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  if (!onReady) {
    return <div>Loading...</div>;
  }

  const MenuItems: {
    [menuName: string]: { label: string; content: React.ReactElement };
  } = {
    profile: {
      label: "プロフィール",
      content: (
        <>
          <div className="p-mypage__bio-title">ゲームタグ</div>
          <div className="p-mypage__bio-games">
            {(userData.userGames ?? []).map((game, idx) => (
              <div key={idx} className="p-mypage__bio-game">
                {game.game.name}
              </div>
            )) || "自己紹介文がありません"}
          </div>
          <div className="p-mypage__bio-title">自己紹介</div>
          <div>
            {userData.bio?.split("\n").map((line, idx) => (
              <div key={idx}>
                {line}
                <br />
              </div>
            ))}
          </div>
        </>
      ),
    },
    courses: {
      label: "講座",
      content: (
        <>
          <div className="p-mypage__bio-courses">
            {(userData.courses ?? []).map((c, i) => (
              <div className="p-mypage__bio-course-container" key={i}>
                <CourseCard course={c} />
                <ImageBox
                  src={editIcon}
                  className="p-mypage__bio-course-edit"
                  onClick={() => router.push(`/courses/course/${c.id}/edit`)}
                />
              </div>
            ))}
          </div>
          <div className="p-mypage__bio-courses-add">
            <IconButton
              src={plusImage}
              onClick={() => router.push("/create")}
              className="p-mypage__bio-courses-add-button"
            />
          </div>
        </>
      ),
    },
  };

  const averageRating: number =
    userData.courses &&
    userData.courses.length > 0 &&
    userData.courses.reduce(
      (totalCount, course) =>
        totalCount + (course.reviews ? course.reviews.length : 0),
      0
    ) !== 0
      ? userData.courses.reduce(
          (totalScore, course) =>
            totalScore +
            (course.reviews
              ? course.reviews.reduce((sum, review) => sum + review.rating, 0)
              : 0),
          0
        ) /
        userData.courses.reduce(
          (totalCount, course) =>
            totalCount + (course.reviews ? course.reviews.length : 0),
          0
        )
      : 0;

  const handleSaveName = async () => {
    try {
      animation.startAnimation();
      await requestDB("user", "updateUser", { id: userData.id, name: newName });
      fetchUserData();
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating bio:", error);
      alert("自己紹介の更新に失敗しました。");
    }
    animation.endAnimation();
  };

  const handleUploadImage = async (file: File, type: "header" | "icon") => {
    try {
      animation.startAnimation();
      const fileName = `${userData.id}/${type}/${Date.now()}.${
        file.type.split("/")[1]
      }`;
      const fileBase64 = await fileToBase64(file);
      const keyPrefix = type;

      const response = await Axios.post("/api/s3/upload", {
        fileName,
        fileType: file.type,
        fileBase64,
        keyPrefix,
      });

      if (response.data.success) {
        const imageUrl = response.data.url;

        await requestDB("user", "updateUser", {
          id: userData.id,
          [type]: imageUrl,
        });
        fetchUserData();
      } else {
        alert("画像のアップロードに失敗しました。");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("画像のアップロードに失敗しました。");
    }

    animation.endAnimation();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result!.toString().split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="p-mypage l-page -fixed">
      <div className="p-mypage__title">マイページ</div>
      <div className="p-mypage__header">
        <ImageBox
          className="p-mypage__header-image"
          src={userData.header || defaultHeader}
          objectFit="cover"
        />
        <ImageBox
          src={editIcon}
          alt="Edit Header"
          className="p-mypage__header-edit"
          onClick={() => headerInputRef.current?.click()}
        />
        <input
          type="file"
          ref={headerInputRef}
          className="p-mypage__header-upload"
          accept="image/*"
          onChange={(e) =>
            e.target.files && handleUploadImage(e.target.files[0], "header")
          }
        />
        <div className="p-mypage__icon">
          <ImageBox
            className="p-mypage__icon-image"
            src={userData.icon || defaultIcon}
            objectFit="cover"
            round
          />
          <div className="p-mypage__icon-edit-wrapper">
            <ImageBox
              src={editIcon}
              alt="Edit Icon"
              className="p-mypage__icon-edit"
              onClick={() => iconInputRef.current?.click()}
            />
            <input
              type="file"
              ref={iconInputRef}
              className="p-mypage__icon-upload"
              accept="image/*"
              onChange={(e) =>
                e.target.files && handleUploadImage(e.target.files[0], "icon")
              }
            />
          </div>
        </div>
      </div>
      <div className="p-mypage__profile-container">
        <div className="p-mypage__profile">
          <div className="p-mypage__profile-info">
            {isEditingName ? (
              <>
                <input
                  className="p-mypage__profile-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  ref={nameInputRef}
                />
                <Button
                  onClick={handleSaveName}
                  className="p-mypage__profile-submit"
                >
                  決定
                </Button>
                <Button
                  onClick={() => setIsEditingName(false)}
                  className="p-mypage__profile-cansel"
                >
                  ×
                </Button>
              </>
            ) : (
              <>
                <div className="p-mypage__profile-name">{userData.name}</div>
                <ImageBox
                  src={editIcon}
                  alt="Edit Icon"
                  className="p-mypage__profile-edit"
                  onClick={() => {
                    setIsEditingName(true);
                    setNewName(userData.name ?? "");
                  }}
                />
              </>
            )}
          </div>
          <div className="p-mypage__profile-rating">
            <StarRating
              className="p-mypage__profile-stars"
              score={averageRating}
            />
            <div className="p-mypage__profile-rating-text">
              (
              {userData.courses.reduce(
                (totalCount, course) =>
                  totalCount + (course.reviews ? course.reviews.length : 0),
                0
              )}
              )
            </div>
          </div>
        </div>
      </div>

      <div className="p-mypage__bio-area">
        <div className="p-mypage__bio-switcher">
          {Object.keys(MenuItems).map((m) => (
            <div
              key={m}
              className={`p-mypage__bio-switcher-item ${
                selectedMenu == m ? "-active" : ""
              }`}
              onClick={() => setSelectedMenu(m)}
            >
              {MenuItems[m].label}
              {m == "profile" && selectedMenu == "profile" && (
                <ImageBox
                  src={editIcon}
                  alt="Edit Icon"
                  className="p-mypage__bio-edit"
                  onClick={() => router.push("/mypage/profile")}
                />
              )}
            </div>
          ))}
        </div>
        <div className="p-mypage__bio-content">
          {MenuItems[selectedMenu].content}
        </div>
      </div>
    </div>
  );
};

export default Page;
