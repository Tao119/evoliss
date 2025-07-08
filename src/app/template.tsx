"use client";

import { UserDataStatus } from "@/hooks/useUserData";
import { requestDB } from "@/services/axios";
import { useSession } from "next-auth/react";
import { Suspense, useContext, useEffect } from "react";
import { UserDataContext } from "./contextProvider";

export default function GuestTemplate({
	children,
}: {
	children: React.ReactNode;
}) {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	const session = useSession();

	useEffect(() => {
		if (!userData && session) {
			fetchUserData();
		}
	}, [userData, session]);

	return (
		<>
			<Suspense>{children}</Suspense>
		</>
	);
}
