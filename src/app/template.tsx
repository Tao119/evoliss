"use client";

import { Suspense, useContext, useEffect } from "react";
import { UserDataContext } from "./contextProvider";
import { requestDB } from "@/services/axios";
import { useSession } from "next-auth/react";
import { UserDataStatus } from "@/hooks/useUserData";

export default function GuestTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const session = useSession();

  useEffect(() => {
    if (!userData && session.data?.user) {
      fetchUserData();
    }
  }, [userData, session.data?.user]);

  return (
    <>
      <Suspense>{children}</Suspense>
    </>
  );
}
