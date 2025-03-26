"use client";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

const ErrorPage = () => {
  const router = useRouter();
  useEffect(() => {
    router.push("/");
  });
  return (
    <>
      <span>このページは存在しません。</span>
      <Link href="/">TOP</Link>へ戻る
    </>
  );
};

export default ErrorPage;
