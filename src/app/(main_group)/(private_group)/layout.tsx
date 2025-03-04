"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useEffect, useState, useRef, useMemo } from "react";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData } = useContext(UserDataContext)!;
  const router = useRouter();
  const path = usePathname();
  const animation = useContext(AnimationContext)!;
  const session = useSession();
  useEffect(() => {
    if (session) {
      if (!session.data?.user) {
        animation.endAnimation();
        router.push(`/sign-in?callback=${path}`);
      }
    }
  }, [userData, session]);

  return <>{children}</>;
}
