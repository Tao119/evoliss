"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { ImageBox } from "@/components/imageBox";
import { Button } from "@/components/button";
import { Axios, requestDB } from "@/services/axios";
import rightIcon from "@/assets/image/arrow_right.svg";
import { useRouter } from "next/navigation";
import { Game } from "@/type/models";
import { GameCard } from "@/app/(component)/gameCard";
import { Pagination } from "@/components/pagination";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const animation = useContext(AnimationContext)!;
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [gameData, setGameData] = useState<{ [page: number]: Game[] }>({});
  const [gameNum, setGameNum] = useState(0);
  const total = 20;

  const onReady = gameData;

  useEffect(() => {
    fetchGameNum();
    animation.startAnimation();
  }, []);

  useEffect(() => {
    if (Object.keys(gameData).includes(currentPage.toString())) {
      return;
    }
    animation.startAnimation();
    fetchGames();
  }, [currentPage]);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  const fetchGameNum = async () => {
    try {
      const response = await requestDB("game", "readGamesNum");
      if (response.success) {
        setGameNum(response.data);
      } else {
        animation.endAnimation();
        alert("ゲーム情報の取得中にエラーが発生しました");
      }
    } catch (error) {
      console.error("Error fetching games:", error);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await requestDB("game", "readGames", {
        page: currentPage,
        total,
      });
      if (response.success) {
        setGameData((prev) => ({ ...prev, [currentPage]: response.data }));
      } else {
        alert("ゲーム情報の取得中にエラーが発生しました");
      }
      animation.endAnimation();
    } catch (error) {
      console.error("Error fetching games:", error);
    }
  };

  if (!onReady) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-games l-page">
      <div className="p-games__title">ゲーム一覧</div>
      <div className="p-courses__sub-title">{`全${gameNum}件中${
        total * (currentPage - 1) + 1
      }~${Math.min(total * currentPage, gameNum)}件を表示`}</div>
      <div className="p-games__list">
        {gameData[currentPage] &&
          gameData[currentPage].map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
      </div>
      <div className="p-games__pagination">
        <Pagination
          all={gameNum}
          total={total}
          page={currentPage}
          updatePage={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default Page;
