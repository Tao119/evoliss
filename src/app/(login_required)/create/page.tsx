"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { Button } from "@/components/button";
import { InputBox } from "@/components/inputBox";
import { MultilineInput } from "@/components/multilineInput";
import { ImageBox } from "@/components/imageBox";
import { Axios, AxiosLongTimeOut, requestDB } from "@/services/axios";
import { useRouter } from "next/navigation";
import Calendar, { CalendarTarget } from "../(component)/calender";
import plusImage from "@/assets/image/plus_white.svg";
import closeImage from "@/assets/image/cross.svg";
import { IconButton } from "@/components/iconButton";
import { BackButton } from "@/components/backbutton";
import { Filter } from "@/components/filter";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const animation = useContext(AnimationContext)!;
  const router = useRouter();

  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tag, setTag] = useState("");
  const [image, setImage] = useState<{ path: string; data: File }>();
  const [schedules, setSchedules] = useState<Date[]>([]);
  const durationNumber = [30, 60, 90, 120];
  const [duration, setDuration] = useState(durationNumber[0]);

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
    return <>Loading...</>;
  }

  const handleSave = async () => {
    if (title.trim() == "") {
      alert("講座タイトルを入力してください");
      return;
    }

    if (price.trim() == "") {
      alert("価格を入力してください");
      return;
    }

    try {
      animation.startAnimation();
      const url = await uploadImage();

      if (image && !url) {
        alert("画像のアップロードに失敗しました");
        return;
      }
      const response = await requestDB("course", "createCourse", {
        title,
        description,
        price: parseInt(price, 10),
        coachId: userData.id,
        schedules,
        image: url,
        tag,
      });

      if (response.success) {
        const course = response.data;
        fetchUserData();
        animation.endAnimation();
        router.push(`courses/course/${course.id}`);
      }
    } catch (error) {
      console.error("Error creating course:", error);
      alert("講座の追加に失敗しました。");
    }
    animation.endAnimation();
  };

  const uploadImage = async () => {
    if (!image) {
      return;
    }
    try {
      const file = image.data;
      const fileName = `${userData.id}/course/${Date.now()}.${
        file.type.split("/")[1]
      }`;
      const fileBase64 = await fileToBase64(file);
      const keyPrefix = "course";

      const response = await AxiosLongTimeOut.post("/api/s3/upload", {
        fileName,
        fileType: file.type,
        fileBase64,
        keyPrefix,
      });

      if (response.data.success) {
        const imageUrl = response.data.url;
        return imageUrl;
      } else {
        alert("画像のアップロードに失敗しました。");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("画像のアップロードに失敗しました。");
    }
    return null;
  };
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result!.toString().split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUploadImage = async (file: File) => {
    if (!file) return;
    const tmpFilePath = URL.createObjectURL(file);
    setImage({ path: tmpFilePath, data: file });
  };

  return (
    <div className="p-course-create l-page">
      <div className="p-course-create__title">講座の出品</div>
      <div className="p-course-create__section">
        <div className="p-course-create__subtitle">・ゲームタグ</div>
        <InputBox
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="ゲームを入力"
          className="p-course-create__single-input"
        />
      </div>
      <div className="p-course-create__section">
        <div className="p-course-create__subtitle">・講座タイトル</div>
        <InputBox
          className="p-course-create__single-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="p-course-create__section">
        <div className="p-course-create__subtitle">・講座の内容</div>
        <MultilineInput
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-course-create__detail-input"
          minHeight={160}
          maxHeight={160}
        />
      </div>
      <div className="p-course-create__section">
        <div className="p-course-create__subtitle">・講座価格</div>
        <InputBox
          className="p-course-create__single-input"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <div className="p-course-create__section">
        <div className="p-course-create__subtitle">・画像</div>
        {image ? (
          <ImageBox
            src={image.path}
            className="p-course-create__image"
            onClick={() => inputRef.current?.click()}
            objectFit="cover"
          >
            <IconButton
              src={closeImage}
              onClick={() => setImage(undefined)}
              className="p-course-create__delete-button"
            />
          </ImageBox>
        ) : (
          <div
            className="p-course-create__image-null"
            onClick={() => inputRef.current?.click()}
          >
            <IconButton
              src={plusImage}
              onClick={() => router.push("/create")}
              className="p-course-create__add-button"
            />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="p-course-create__image-upload"
          onChange={(e) =>
            e.target.files && handleUploadImage(e.target.files[0])
          }
        />
      </div>
      <div className="p-course-create__section">
        <div className="p-course-create__subtitle">・講座時間</div>
        <Filter
          onChange={setDuration}
          selectedValue={duration}
          options={durationNumber.map((d) => {
            return { label: `${d}分`, value: d };
          })}
          className="p-course-create__detail-filter"
        />
      </div>

      <div className="p-course-create__section">
        <div className="p-course-create__subtitle">・スケジュール</div>
        <Calendar
          schedule={schedules}
          setSchedule={setSchedules}
          target={CalendarTarget.editor}
          duration={duration}
        />
      </div>

      <Button onClick={handleSave} className="p-course-create__save-button">
        保存
      </Button>
    </div>
  );
};

export default Page;
