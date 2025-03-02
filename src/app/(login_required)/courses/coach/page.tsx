"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { ImageBox } from "@/components/imageBox";
import { Button } from "@/components/button";
import { Axios, requestDB } from "@/services/axios";
import rightIcon from "@/assets/image/arrow_right.svg";
import { useRouter } from "next/navigation";
import { User } from "@/type/models";
import { CoachCard } from "../../(component)/coachCard";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const [coacheData, setCoacheData] = useState<User[]>();
  const animation = useContext(AnimationContext)!;
  const router = useRouter();

  const onReady = userData && coacheData;

  useEffect(() => {
    fetchCoaches();
    animation.startAnimation();
  }, []);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  const fetchCoaches = async () => {
    try {
      const response = await requestDB("coach", "readCoaches");
      if (response.success) {
        setCoacheData(response.data);
      } else {
        animation.endAnimation();
        alert("コーチ情報の取得中にエラーが発生しました");
      }
    } catch (error) {
      console.error("Error fetching coaches:", error);
    }
  };

  if (!onReady) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-coaches l-page">
      <div className="p-coaches__title">コーチ一覧</div>
      <div className="p-coaches__list">
        {coacheData.map((coach) => (
          <CoachCard key={coach.id} coach={coach} />
        ))}
      </div>
    </div>
  );
};

export default Page;
