"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();

  return (
    <div>
      <div>決済に成功しました！</div>
      <div onClick={() => router.push("/")}>TOPへ戻る</div>
    </div>
  );
};

export default Page;
