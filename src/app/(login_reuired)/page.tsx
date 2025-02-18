"use client";
import { requestDB } from "@/services/axios";
import { useContext, useEffect, useState } from "react";
import { UserDataContext } from "../contextProvider";
import Sidebar from "./sideBar";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  useEffect(() => {
    router.push("about");
  });

  return <div></div>;
};

export default Page;
