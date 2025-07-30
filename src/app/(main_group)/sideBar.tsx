"use client";

import chartIcon from "@/assets/image/chart.svg";
import closeIcon from "@/assets/image/close.svg";
import logoImage from "@/assets/image/logo_long.png";
import messageIcon from "@/assets/image/mail.svg";
import notificationIcon from "@/assets/image/notification.svg";
import defaultIcon from "@/assets/image/user_icon.svg";
import { ImageBox } from "@/components/imageBox";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, {
	type Dispatch,
	type SetStateAction,
	useContext,
	useState,
} from "react";
import { UserDataContext } from "../contextProvider";
import { signOut } from "next-auth/react";

interface Prop {
	setShowSideBar: Dispatch<SetStateAction<boolean>>;
}

const Sidebar = ({ setShowSideBar }: Prop) => {
	const { userData } = useContext(UserDataContext)!;
	const pathname = usePathname()!;
	const router = useRouter();

	// ルートのアクティブ判定関数
	const isActiveRoute = (currentPath: string, targetPath: string) => {
		// TOPページの場合は完全一致
		if (targetPath === "/") {
			return currentPath === "/";
		}

		// /courses/coach の場合
		if (targetPath === "/courses/coach") {
			return currentPath.startsWith("/courses/coach");
		}

		// /courses の場合（/courses/coach以外）
		if (targetPath === "/courses") {
			return currentPath.startsWith("/courses") && !currentPath.startsWith("/courses/coach");
		}

		return false;
	};

	const mainRoutes = [
		{ path: "/", text: "TOP" },
		{ path: "/courses/coach", text: "コーチから探す" },
		{ path: "/courses", text: "講座を検索する" },
	];
	const iconRoutes = [
		{
			path: "/mypage",
			icon: userData?.icon || defaultIcon,
			alt: "user Icon",
			text: "マイページ",
		},
	];

	const pushRoute = (path: string) => {
		setShowSideBar(false);
		router.push(path);
	};

	const handleLogout = async () => {
		setShowSideBar(false);
		await signOut({ redirect: true, callbackUrl: "/" });
	};

	return (
		<>
			<div className="p-side-bar">
				<div className="p-side-bar__icon" onClick={() => router.push("/")}>
					<ImageBox
						src={logoImage}
						alt="Profile"
						objectFit="cover"
						className="p-side-bar__logo-icon"
					/>
					<ImageBox
						src={closeIcon}
						className="p-side-bar__close"
						onClick={() => setShowSideBar(false)}
					/>
				</div>

				<ul className="p-side-bar__container -upper">
					{mainRoutes.map(({ path, text }) => (
						<div
							onClick={() => pushRoute(path)}
							key={path}
							className={`p-side-bar__list p-side-bar__glitch-btn ${isActiveRoute(pathname, path) ? "-active" : ""}`}
						>
							{text && (
								<>
									<div className="p-side-bar__glitch-label">
										{text}
									</div>
									{/* グリッチエフェクト用のマスク */}
									<div className="p-side-bar__glitch-mask"><span>{text}</span></div>
									<div className="p-side-bar__glitch-mask"><span>{text}</span></div>
									<div className="p-side-bar__glitch-mask"><span>{text}</span></div>
									<div className="p-side-bar__glitch-mask"><span>{text}</span></div>
									<div className="p-side-bar__glitch-mask"><span>{text}</span></div>
								</>
							)}
						</div>
					))}
				</ul>
				<ul className="p-side-bar__container -lower">
					{userData?.isAdmin && (
						<Link href={`/admin`} className="p-side-bar__list p-side-bar__glitch-btn">
							<ImageBox
								className="p-side-bar__page-icon"
								src={chartIcon}
								objectFit="cover"
								round
							/>
							<div className="p-side-bar__glitch-label">
								管理者ページ
							</div>
							{/* グリッチエフェクト用のマスク */}
							<div className="p-side-bar__glitch-mask"><span>管理者ページ</span></div>
							<div className="p-side-bar__glitch-mask"><span>管理者ページ</span></div>
							<div className="p-side-bar__glitch-mask"><span>管理者ページ</span></div>
							<div className="p-side-bar__glitch-mask"><span>管理者ページ</span></div>
							<div className="p-side-bar__glitch-mask"><span>管理者ページ</span></div>
						</Link>
					)}
					{userData ? (
						iconRoutes.map(({ path, icon, alt, text }) => {
							return (
								<div
									onClick={() => pushRoute(path)}
									key={path}
									className={`p-side-bar__list p-side-bar__glitch-btn ${pathname.replace("/", "").split("/")[0] ==
										`${path.replace("/", "")}`
										? "-active"
										: ""
										}`}
								>
									{/* <ImageBox
										className="p-side-bar__page-icon"
										src={icon}
										objectFit="cover"
										round
									/> */}
									{text && (
										<>
											<div className="p-side-bar__glitch-label">
												{text}
											</div>
											{/* グリッチエフェクト用のマスク */}
											<div className="p-side-bar__glitch-mask"><span>{text}</span></div>
											<div className="p-side-bar__glitch-mask"><span>{text}</span></div>
											<div className="p-side-bar__glitch-mask"><span>{text}</span></div>
											<div className="p-side-bar__glitch-mask"><span>{text}</span></div>
											<div className="p-side-bar__glitch-mask"><span>{text}</span></div>
										</>
									)}
								</div>
							);
						})
					) : (
						<div className="p-side-bar__login p-side-bar__page-text">
							<div onClick={() => pushRoute(`/sign-in${pathname ? "?callback=" + pathname : ""}`)}>
								ログイン
							</div>
							{" | "}
							<div onClick={() => pushRoute(`/sign-up${pathname ? "?callback=" + pathname : ""}`)}>
								新規登録
							</div>
						</div>
					)}
					{userData && (
						<div
							onClick={handleLogout}
							className="p-side-bar__list p-side-bar__glitch-btn p-side-bar__logout"
						>
							<div className="p-side-bar__glitch-label">
								ログアウト
							</div>
							{/* グリッチエフェクト用のマスク */}
							<div className="p-side-bar__glitch-mask"><span>ログアウト</span></div>
							<div className="p-side-bar__glitch-mask"><span>ログアウト</span></div>
							<div className="p-side-bar__glitch-mask"><span>ログアウト</span></div>
							<div className="p-side-bar__glitch-mask"><span>ログアウト</span></div>
							<div className="p-side-bar__glitch-mask"><span>ログアウト</span></div>
						</div>
					)}
				</ul>
			</div>
		</>
	);
};

export default Sidebar;
