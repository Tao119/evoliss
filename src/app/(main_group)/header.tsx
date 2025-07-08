"use client";

import chartIcon from "@/assets/image/chart.svg";
import hamburgerIconWhite from "@/assets/image/hamburger-white.svg";
import hamburgerIcon from "@/assets/image/hamburger.svg";
import logoImage from "@/assets/image/logo-black.svg";
import logoImageWhite from "@/assets/image/logo_long.png";
import messageIcon from "@/assets/image/mail.svg";
import mypageIconWhite from "@/assets/image/mypage-white.svg";
import mypageIcon from "@/assets/image/mypage.svg";
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
import { UserDataContext, useHeader } from "../contextProvider";

interface Prop {
	setShowSideBar: Dispatch<SetStateAction<boolean>>;
}

const Header = ({ setShowSideBar }: Prop) => {
	const { userData } = useContext(UserDataContext)!;
	const pathname = usePathname()!;
	const router = useRouter();

	const { isTopPanelVisible } = useHeader();

	const mainRoutes = [
		{ path: "/courses/coach", text: "コーチから探す" },
		{ path: "/courses", text: "講座を検索する" },
	];
	const iconRoutes = [
		{
			path: "/notification",
			icon: notificationIcon,
			alt: "notification Icon",
			text: "通知",
		},
		{
			path: "/message",
			icon: messageIcon,
			alt: "Message Icon",
			text: "メッセージ",
		},
		{
			path: "/mypage",
			icon: userData?.icon || defaultIcon,
			alt: "user Icon",
			text: "マイページ",
		},
	];

	const pushRoute = (path: string) => {
		router.push(path);
	};

	const isHomePage = pathname.replace("/", "") === "";
	const shouldChangeHeaderStyle = isHomePage && isTopPanelVisible;

	return (
		<>
			<div
				className={`p-header ${isHomePage ? "-top" : ""} ${
					shouldChangeHeaderStyle ? "-wh" : ""
				}`}
			>
				<div className="p-header__icon" onClick={() => router.push("/")}>
					<ImageBox
						src={shouldChangeHeaderStyle ? logoImageWhite : logoImage}
						alt="Profile"
						objectFit="cover"
						className="p-header__logo-icon"
					/>
				</div>
				<ul className="p-header__container -upper">
					{mainRoutes.map(({ path, text }) => (
						<div
							onClick={() => pushRoute(path)}
							key={path}
							className={`p-header__list ${
								pathname.replace("/", "").split("/")[0] ==
								`${path.replace("/", "")}`
									? "-active"
									: ""
							}`}
						>
							{text && (
								<div
									className={`p-header__page-text ${
										pathname.replace("/", "").split("/")[0] ==
										`${path.replace("/", "")}`
											? "-active"
											: ""
									}`}
								>
									{text}
								</div>
							)}
						</div>
					))}
				</ul>
				<ul className="p-header__container -lower">
					{userData?.isAdmin && (
						<Link href={`/admin`} className="p-header__list">
							<ImageBox
								className="p-header__page-icon"
								src={chartIcon}
								objectFit="cover"
								round
							/>
							<div
								className={`p-header__page-text ${
									pathname.replace("/", "").split("/")[0] == "admin"
										? "-active"
										: ""
								}`}
							>
								管理者ページ
							</div>
						</Link>
					)}
					{userData ? (
						<Link
							href={`/mypage`}
							className={`p-header__login ${
								shouldChangeHeaderStyle ? "-wh" : ""
							}`}
						>
							<ImageBox
								className={`p-header__page-icon`}
								src={shouldChangeHeaderStyle ? mypageIconWhite : mypageIcon}
							/>
							<div className={"p-header__page-text"}>マイページ</div>
						</Link>
					) : (
						<Link
							href={`/sign-in${pathname ? "?callback=" + pathname : ""}`}
							className={`p-header__login ${
								shouldChangeHeaderStyle ? "-wh" : ""
							}`}
						>
							<ImageBox
								className={`p-header__page-icon`}
								src={shouldChangeHeaderStyle ? mypageIconWhite : mypageIcon}
							/>
							<div className={"p-header__page-text"}>ログイン</div>
						</Link>
					)}
				</ul>
				<ImageBox
					src={shouldChangeHeaderStyle ? hamburgerIconWhite : hamburgerIcon}
					className="p-header__menu"
					onClick={() => setShowSideBar(true)}
				/>
			</div>
		</>
	);
};

export default Header;
