"use client";

import { Button } from "@/components/button";
import { useBreakpoint } from "@/hooks/useBreakPoint";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
	const { orLower, breakpoint } = useBreakpoint()!;
	const router = useRouter();
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		if (breakpoint !== undefined) {
			setIsInitialized(true);
		}
	}, [breakpoint]);

	useEffect(() => {
		if (isInitialized && orLower && !orLower("sp")) {
			router.push("/mypage/profile");
		}
	}, [orLower, isInitialized, router]);

	if (!isInitialized) {
		return <></>;
	}

	if (orLower && orLower("sp")) {
		return <div className="">MENU FOR SMARTPHONE</div>;
	}

	return <></>;
};

export default Page;
