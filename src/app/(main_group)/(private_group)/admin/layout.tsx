"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { UserDataStatus } from "@/hooks/useUserData";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useEffect, useState, useRef, useMemo } from "react";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userDataStatus, userData } = useContext(UserDataContext)!;
  const router = useRouter();
  const path = usePathname();
  const animation = useContext(AnimationContext)!;
  useEffect(() => {
    if (userDataStatus == UserDataStatus.Authorized && !userData?.isAdmin) {
      animation.endAnimation();
      router.push(`/`);
    }
  }, [userDataStatus]);

  if (userDataStatus != UserDataStatus.Authorized) return null;
  return <>{children}</>;
}
