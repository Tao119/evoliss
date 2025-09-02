"use client";

import chartIcon from "@/assets/image/chart.svg";
import hamburgerIconWhite from "@/assets/image/hamburger-white.svg";
import hamburgerIcon from "@/assets/image/hamburger.svg";
import logoImage from "@/assets/logo/png/Evoliss-Logo_Type-3_L.png";
import logoImageSmall from "@/assets/logo/png/Evoliss-Logo_Type-1_L.png";
import logoImageWhite from "@/assets/logo/png/Evoliss-Logo_Type-4-white_L.png";
import logoImageSmallWhite from "@/assets/logo/png/Evoliss-Logo_Type-2-white_L.png";
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
	useEffect,
	useState,
} from "react";
import { UserDataContext, useHeader } from "../contextProvider";
import { useBreakpoint } from "@/hooks/useBreakPoint";

interface Prop {
	setShowSideBar: Dispatch<SetStateAction<boolean>>;
}

const Header = ({ setShowSideBar }: Prop) => {
	const { userData } = useContext(UserDataContext)!;
	const pathname = usePathname()!;
	const router = useRouter();

	const { isTopPanelVisible, setIsTopPanelVisible } = useHeader();

	const { orLower } = useBreakpoint()

	// ホームページ以外では常にヘッダーを通常スタイルにする
	useEffect(() => {
		if (pathname !== "/") {
			setIsTopPanelVisible(false);
		}
	}, [pathname, setIsTopPanelVisible]);

	const mainRoutes = [
		{ path: "/courses/coach", text: "コーチから探す" },
		{ path: "/courses", text: "講座から探す" },
	];

	const pushRoute = (path: string) => {
		router.push(path);
	};

	// ホームページの判定を厳密に
	const isHomePage = pathname === "/";
	// ホームページでかつトップパネルが表示されている場合のみ白いヘッダー
	const shouldChangeHeaderStyle = isHomePage && isTopPanelVisible;

	return (
		<>
			<div
				className={`p-header ${isHomePage ? "-top" : ""} ${shouldChangeHeaderStyle ? "-wh" : ""
					}`}
			>{!orLower("sp") ? <>
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
							className={`p-header__list ${pathname.replace("/", "").split("/")[0] ==
								`${path.replace("/", "")}`
								? "-active"
								: ""
								}`}
						>
							{text && (
								<div
									className={`p-header__page-text ${pathname.replace("/", "").split("/")[0] ==
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
								className={`p-header__page-text ${pathname.replace("/", "").split("/")[0] == "admin"
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
							className={`p-header__login ${shouldChangeHeaderStyle ? "-wh" : ""
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
							className={`p-header__login ${shouldChangeHeaderStyle ? "-wh" : ""
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

			</> : <>
				<div className="p-header__icon -small" onClick={() => router.push("/")}>
					<ImageBox
						src={shouldChangeHeaderStyle ? logoImageSmallWhite : logoImageSmall}
						alt="Profile"
						objectFit="cover"
						className="p-header__logo-icon"
					/>
				</div>

				<Link
					href={userData ? `/mypage` : `/sign-in${pathname ? "?callback=" + pathname : ""}`}
					className={`p-header__login ${shouldChangeHeaderStyle ? "-wh" : ""
						}`}
				>
					<ImageBox
						className={`p-header__page-icon`}
						src={shouldChangeHeaderStyle ? mypageIconWhite : mypageIcon}
					/>
				</Link>

			</>
				}
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
