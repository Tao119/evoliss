"use client";
import { CoachCard } from "@/app/(component)/coachCard";
import { CourseCard } from "@/app/(component)/courseCard";
import { GameCard } from "@/app/(component)/gameCard";
import { SearchArea } from "@/app/(component)/searchArea";
import {
	AnimationContext,
	UserDataContext,
	useHeader,
} from "@/app/contextProvider";
import downIcon from "@/assets/image/arrow_down.svg";
import chartIcon from "@/assets/image/chart.svg";
import harunIcon from "@/assets/image/harun_logo.svg";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import { InputBox } from "@/components/inputBox";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { requestDB } from "@/services/axios";
import type { Course, Game, Tag, User } from "@/type/models";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

const Page = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const { setIsTopPanelVisible } = useHeader();
	const router = useRouter();

	const [games, setGames] = useState<Game[]>();
	const [tags, setTags] = useState<Tag[]>();
	const [coaches, setCoaches] = useState<User[]>();
	const [courses, setCourses] = useState<Course[]>();

	const [searchText, setSearchText] = useState("");
	const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set());
	const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());

	const onReady = games && coaches && courses && tags;

	const { elementRef: topPanelRef, isIntersecting } = useIntersectionObserver({
		threshold: 0,
		rootMargin: "0px",
	});

	useEffect(() => {
		setIsTopPanelVisible(isIntersecting);
	}, [isIntersecting, setIsTopPanelVisible]);

	useEffect(() => {
		animation.startAnimation();
		fetchGames();
		fetchTags();
		fetchCoaches();
		fetchCourses();
	}, []);

	// useEffect(() => {
	//   const intervalId = setInterval(() => {
	//     fetchCourses();
	//     fetchCoaches();
	//     fetchTags();
	//     fetchGames();
	//   }, 60 * 1000);

	//   return () => clearInterval(intervalId);
	// }, []);

	useEffect(() => {
		if (onReady) {
			animation.endAnimation();
		}
	}, [onReady]);

	const fetchGames = async () => {
		try {
			const response = await requestDB("game", "readTopGames");
			if (response.success) {
				setGames(response.data);
			} else {
				console.error("Failed to fetch games:", response);
				alert("ゲーム情報の取得中にエラーが発生しました");
			}
		} catch (error) {
			console.error("Error fetching games:", error);
		}
	};
	const fetchTags = async () => {
		try {
			const response = await requestDB("tag", "readTags");
			if (response.success) {
				setTags(response.data);
			} else {
				console.error("Failed to fetch games:", response);
				alert("タグ情報の取得中にエラーが発生しました");
			}
		} catch (error) {
			console.error("Error fetching games:", error);
		}
	};

	const fetchCoaches = async () => {
		try {
			const response = await requestDB("coach", "readTopCoaches");
			if (response.success) {
				setCoaches(response.data);
			} else {
				console.error("Failed to fetch coaches:", response);
				alert("コーチ情報の取得中にエラーが発生しました");
			}
		} catch (error) {
			console.error("Error fetching coaches:", error);
		}
	};

	const fetchCourses = async () => {
		try {
			const response = await requestDB("course", "readTopCourses");
			if (response.success) {
				setCourses(response.data);
			} else {
				console.error("Failed to fetch courses:", response);
				alert("コース情報の取得中にエラーが発生しました");
			}
		} catch (error) {
			console.error("Error fetching courses:", error);
		}
	};

	const onInputChange = (event: { target: HTMLInputElement }) => {
		setSearchText(event.target.value);
	};

	if (!onReady) {
		return <></>;
	}

	return (
		<div className="p-about l-page">
			<div
				className="p-about__top-panel"
				ref={topPanelRef}
				onLoad={() => console.log("🏠 Top panel loaded")}
			>
				<video
					className="p-about__top-panel-background"
					src={require("/public/home-movie.mp4")}
					autoPlay
					playsInline
					muted
				/>
				<div className="p-about__top-panel-phrase-container">
					<div className="p-about__top-panel-phrase">
						もっと強くなりたい人と、
					</div>
					<div className="p-about__top-panel-phrase">
						そのサポートをしたい人を繋ぐ。
					</div>
				</div>

				<div className="p-about__top-panel-support-container">
					<div className="p-about__top-panel-support">
						supported by はるnチャンネル
					</div>
					<ImageBox
						className="p-about__top-panel-support-logo"
						src={harunIcon}
					/>
				</div>
			</div>

			<div className="p-about__content">
				{!userData && (
					<div className="p-about__login-panel">
						<div className="p-about__login-panel-title">
							まずは会員登録から！
						</div>
						<div className="p-about__login-panel-text">
							※コーチングを受ける・コーチになるには、会員登録が必要です。
						</div>
						<Button
							onClick={() => router.push("/sign-up")}
							className="p-about__login-panel-button"
						>
							新規会員登録
						</Button>
					</div>
				)}

				<div className="p-about__panel">
					<div className="p-about__section-title">コーチから選ぶ</div>
					<Border />
					<div className="p-about__section-sub-title">
						<ImageBox className="p-about__section-icon" src={chartIcon} />
						Top coaches
					</div>
					<div className="p-about__coach-list">
						{coaches?.map((coach, i) => (
							<CoachCard key={i} coach={coach} />
						))}
					</div>
					<Button
						className="p-about__more"
						onClick={() => router.push("/courses/coach")}
					>
						コーチをもっとみる
					</Button>
				</div>

				<div className="p-about__panel">
					<div className="p-about__section-title">講座を検索する</div>
					<Border />
					<SearchArea
						games={games}
						tags={tags}
						selectedGames={selectedGames}
						selectedTags={selectedTags}
						setSelectedGames={setSelectedGames}
						setSelectedTags={setSelectedTags}
						searchText={searchText}
						onInputChange={onInputChange}
					/>
					<Button
						className="p-about__more"
						onClick={() =>
							router.push(
								`/courses?query=${searchText}&games=${Array.from(
									selectedGames,
								).join("-")}&tags=${Array.from(selectedTags).join("-")}`,
							)
						}
					>
						検索
					</Button>
				</div>

				<div className="p-about__panel">
					<div className="p-about__section-title">コーチになりたい</div>
					<Border />
					{userData ? (
						<Button
							onClick={() => router.push("/mypage")}
							className="p-about__become-button"
						>
							マイページ
						</Button>
					) : (
						<>
							<div className="p-about__become-text">
								会員登録後、マイページから講座情報を入力してください
							</div>
							<Button
								onClick={() => router.push("/sign-in?callback=mypage")}
								className="p-about__become-button"
							>
								ログイン
							</Button>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default Page;
