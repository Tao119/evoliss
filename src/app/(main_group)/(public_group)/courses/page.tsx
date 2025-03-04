"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { ImageBox } from "@/components/imageBox";
import { Button } from "@/components/button";
import { Axios, requestDB } from "@/services/axios";
import rightIcon from "@/assets/image/arrow_right.svg";
import { useRouter } from "next/navigation";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const animation = useContext(AnimationContext)!;
  const router = useRouter();

  return (
    <div className="p-courses l-page">
      <div className="p-courses__history">
        <div className="p-courses__history-title">検索履歴</div>
        <div className="p-courses__histories">
          {userData?.searchHistories.slice(0, 5).map((h, i) => (
            <div
              key={i}
              className="p-courses__history-query"
              onClick={() => router.push(`/courses/result?query=${h.query}`)}
            >
              {h.query}
            </div>
          ))}
        </div>
      </div>
      <div
        className="p-courses__button"
        onClick={() => router.push("/courses/game")}
      >
        ゲーム一覧
        <ImageBox className="p-courses__right" src={rightIcon} />
      </div>
      <div
        className="p-courses__button"
        onClick={() => router.push("/courses/coach")}
      >
        コーチ一覧
        <ImageBox className="p-courses__right" src={rightIcon} />
      </div>
    </div>
  );
};

export default Page;
