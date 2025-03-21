"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { ImageBox } from "@/components/imageBox";
import { Button } from "@/components/button";
import { Axios, requestDB } from "@/services/axios";
import rightIcon from "@/assets/image/arrow_right.svg";
import { useRouter } from "next/navigation";
import { User } from "@/type/models";
import { CoachCard } from "@/app/(component)/coachCard";
import { Pagination } from "@/components/pagination";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const animation = useContext(AnimationContext)!;
  const [coachData, setCoachData] = useState<{ [page: number]: User[] }>({});
  const [coachNum, setCoachNum] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const total = 20;

  const onReady = coachData;

  useEffect(() => {
    fetchCoachNum();
    animation.startAnimation();
  }, []);
  useEffect(() => {
    if (Object.keys(coachData).includes(currentPage.toString())) {
      return;
    }
    fetchCoaches();
    animation.startAnimation();
  }, [currentPage]);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  const fetchCoachNum = async () => {
    try {
      const response = await requestDB("coach", "readCoachesNum");
      if (response.success) {
        setCoachNum(response.data);
      } else {
        alert("コーチ情報の取得中にエラーが発生しました");
      }
      animation.endAnimation();
    } catch (error) {
      console.error("Error fetching coachs:", error);
    }
  };

  const fetchCoaches = async () => {
    try {
      const response = await requestDB("coach", "readCoaches", {
        page: currentPage,
        total,
      });
      if (response.success) {
        setCoachData((prev) => ({ ...prev, [currentPage]: response.data }));
      } else {
        alert("コーチ情報の取得中にエラーが発生しました");
      }
      animation.endAnimation();
    } catch (error) {
      console.error("Error fetching coachs:", error);
    }
  };

  if (!onReady) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-coaches l-page">
      <div className="p-coaches__title">コーチ一覧</div>
      <div className="p-courses__sub-title">{`全${coachNum}件中${
        total * (currentPage - 1) + 1
      }~${Math.min(total * currentPage, coachNum)}件を表示`}</div>
      <div className="p-coaches__list">
        {coachData[currentPage] &&
          coachData[currentPage].map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
      </div>
      <div className="p-coaches__pagination">
        <Pagination
          all={coachNum}
          total={total}
          page={currentPage}
          updatePage={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default Page;
