"use client";
import Link from "next/link";

const ErrorPage = () => {
  return (
    <>
      <span>このページは存在しません。</span>
      <Link href="/about">TOP</Link>へ戻る
    </>
  );
};

export default ErrorPage;
