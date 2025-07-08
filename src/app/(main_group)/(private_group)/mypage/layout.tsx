"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { ImageBox } from "@/components/imageBox";
import { useBreakpoint } from "@/hooks/useBreakPoint";
import { UserDataStatus } from "@/hooks/useUserData";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import defaultIcon from "@/assets/image/user_icon.svg";
import Link from "next/link";


interface MenuItem {
	name: string;
	path: string;
}

export default function GuestLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { userDataStatus, userData } = useContext(UserDataContext)!;
	const router = useRouter();
	const path = usePathname();
	const animation = useContext(AnimationContext);

	const { breakpoint, orLower } = useBreakpoint();
	const session = useSession();

	const menuItems: MenuItem[] = [
		{ name: "プロフィール変更", path: "/mypage/profile" },
		{ name: "メッセージ", path: "/mypage/message" },
		{ name: "受講予定の講座", path: "/mypage/courses/upcoming" },
		{ name: "受講済みの講座", path: "/mypage/courses/completed" },
	]

	const coachMenuItems: MenuItem[] = [
		{ name: "新規講座作成", path: "/mypage/coach/create" },
		{ name: "講座一覧", path: "/mypage/coach/list" },
		{ name: "開講予定の講座", path: "/mypage/coach/upcoming" },
		{ name: "開講済みの講座", path: "/mypage/coach/completed" },
		{ name: "マイカレンダー", path: "/mypage/calendar" },
		{ name: "入金口座登録", path: "/mypage/bank" },
	]

	// パスがアクティブかどうかを判定する関数
	const isActiveMenu = (menuPath: string, currentPath: string): boolean => {
		// /mypage/message と /mypage/message/xxx のようにプレフィックスで判定
		return currentPath.startsWith(menuPath);
	};

	const handleMenuClick = (path: string) => {
		router.push(path);
	};

	// メニューアイテムをプリフェッチ
	useEffect(() => {
		[...menuItems, ...coachMenuItems].forEach(item => {
			router.prefetch(item.path);
		});
	}, [router]);

	if (!userData) return <></>;

	return (
		<>
			<div className="p-mypage l-page">
				<div className="p-mypage-menu">
					<ImageBox
						className="p-mypage-menu__icon"
						src={userData.icon || defaultIcon}
						objectFit="cover"
						round
					/>
					<div className="p-mypage-menu__name">{userData.name}</div>

					<div className="p-mypage-menu__menu-outline">
						<div className="p-mypage-menu__menu">
							{menuItems.map(((m, i) => (
								<div className={`p-mypage-menu__menu-item ${isActiveMenu(m.path, path) ? "-active" : ""}`} onClick={() => handleMenuClick(m.path)} key={i}>{m.name}</div>
							)))}
						</div>
					</div>
					<div className="p-mypage-menu__label">コーチ用メニュー</div>
					<div className="p-mypage-menu__menu-outline">
						<div className="p-mypage-menu__menu">
							{coachMenuItems.map(((m, i) => (
								<div className={`p-mypage-menu__menu-item ${isActiveMenu(m.path, path) ? "-active" : ""}`} onClick={() => handleMenuClick(m.path)} key={i}>{m.name}</div>
							)))}
						</div>
					</div><div className="p-mypage-menu__menu-outline">
						<div className="p-mypage-menu__menu">
							<Link className={`p-mypage-menu__menu-item`} href="/contact">お問い合わせ</Link>
						</div>
					</div>
				</div>
				<div className="p-mypage__content">{children}</div>
			</div>
		</>
	);
}
