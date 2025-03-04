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

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const [gameData, setGameData] = useState<Game[]>();
  const animation = useContext(AnimationContext)!;
  const router = useRouter();

  const onReady = gameData;

  useEffect(() => {
    fetchGames();
    animation.startAnimation();
  }, []);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  const fetchGames = async () => {
    try {
      const response = await requestDB("game", "readGames");
      if (response.success) {
        setGameData(response.data);
      } else {
        animation.endAnimation();
        alert("ゲーム情報の取得中にエラーが発生しました");
      }
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
      <div className="p-games__list">
        {gameData.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
};

export default Page;
