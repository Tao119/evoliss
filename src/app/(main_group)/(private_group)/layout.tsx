"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { UserDataStatus } from "@/hooks/useUserData";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState } from "react";

export default function GuestLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { userDataStatus, userData } = useContext(UserDataContext)!;
	const router = useRouter();
	const path = usePathname();
	const animation = useContext(AnimationContext)!;
	const session = useSession();
	useEffect(() => {
		if (userDataStatus == UserDataStatus.unAuthorized) {
			animation.endAnimation();
			router.push(`/sign-in?callback=${path}`);
		}
	}, [userDataStatus]);

	return <>{children}</>;
}
