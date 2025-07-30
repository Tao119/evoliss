"use client";

import { CourseCard } from "@/app/(component)/courseCard";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import defaultImage from "@/assets/image/user_icon.svg";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import StarRating from "@/components/starRating";
import { Axios, requestDB } from "@/services/axios";
import type { Course, User } from "@/type/models";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";


import youtubeIcon from "@/assets/image/youtube.svg"
import xIcon from "@/assets/image/x.svg"
import noteIcon from "@/assets/image/note.svg"
import Link from "next/link";
import { BackButton } from "@/components/backbutton";

const Page = () => {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	const [coachData, setCoachData] = useState<User>();
	const animation = useContext(AnimationContext)!;
	const router = useRouter();
	const { coachId } = useParams()!;
	const coachIdNumber = Number.parseInt(coachId as string);

	const [currentPage, setCurrentPage] = useState(1);
	const [allCourses, setAllCourses] = useState<Course[]>([]);
	const [courseNum, setCourseNum] = useState(0);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const total = 10;

	const onReady = coachData !== undefined;
	const hasMoreCourses = allCourses.length < courseNum;

	useEffect(() => {
		fetchCoursesNum();
		fetchCoach();
		fetchCourses(1);
		animation.startAnimation();
	}, []);

	useEffect(() => {
		if (onReady && allCourses.length > 0) {
			animation.endAnimation();
		}
	}, [onReady, allCourses]);

	useEffect(() => {
		const intervalId = setInterval(() => {
			fetchCoach();
			refreshFirstPage();
		}, 60 * 1000);

		return () => clearInterval(intervalId);
	}, []);

	const fetchCoursesNum = async () => {
		try {
			const response = await requestDB("course", "readCoursesNumByCoachId", {
				coachId: coachIdNumber,
			});
			if (response.success) {
				setCourseNum(response.data);
			} else {
				alert("コース情報の取得中にエラーが発生しました");
			}
		} catch (error) {
			console.error("Error fetching courses count:", error);
		}
	};

	const fetchCourses = async (page: number) => {
		try {
			const response = await requestDB("course", "readCoursesByCoachId", {
				coachId: coachIdNumber,
				page: page,
				total,
			});
			if (response.success) {
				if (page === 1) {
					setAllCourses(response.data);
				} else {
					setAllCourses((prev) => [...prev, ...response.data]);
				}
			} else {
				alert("コース情報の取得中にエラーが発生しました");
			}
		} catch (error) {
			console.error("Error fetching courses:", error);
		}
	};

	const fetchCoach = async () => {
		try {
			const response = await requestDB("coach", "readCoachById", {
				id: coachIdNumber,
			});
			if (response.success) {
				setCoachData(response.data);
			} else {
				alert("コーチ情報の取得中にエラーが発生しました");
			}
		} catch (error) {
			console.error("Error fetching coach:", error);
		}
	};

	const refreshFirstPage = async () => {
		try {
			const response = await requestDB("course", "readCoursesByCoachId", {
				coachId: coachIdNumber,
				page: 1,
				total,
			});
			if (response.success && allCourses.length > 0) {
				const updatedCourses = [...response.data, ...allCourses.slice(total)];
				setAllCourses(updatedCourses);
			}
		} catch (error) {
			console.error("Error refreshing first page:", error);
		}
	};

	const loadMoreCourses = async () => {
		if (isLoadingMore || !hasMoreCourses) return;

		setIsLoadingMore(true);
		animation.startAnimation();

		try {
			const nextPage = currentPage + 1;
			await fetchCourses(nextPage);
			setCurrentPage(nextPage);
		} catch (error) {
			console.error("Error loading more courses:", error);
		} finally {
			setIsLoadingMore(false);
			animation.endAnimation();
		}
	};

	if (!onReady) {
		return <div></div>;
	}

	const averageRating: number =
		coachData.courses &&
			coachData.courses.length > 0 &&
			coachData.courses.reduce(
				(totalCount, course) =>
					totalCount + (course.reviews ? course.reviews.length : 0),
				0,
			) != 0
			? coachData.courses.reduce(
				(totalScore, course) =>
					totalScore +
					(course.reviews
						? course.reviews.reduce((sum, review) => sum + review.rating, 0)
						: 0),
				0,
			) /
			coachData.courses.reduce(
				(totalCount, course) =>
					totalCount + (course.reviews ? course.reviews.length : 0),
				0,
			)
			: 0;

	const reviewNum = coachData.courses.reduce(
		(total, course) => total + (course.reviews?.length || 0),
		0,
	);

	return (
		<div className="p-courses l-page">
			<BackButton className="p-courses__back" back={() => router.push("/courses/coach")} />
			<div className="p-courses__section">
				<div className="p-courses__title">コーチ詳細</div>
				<Border />
				<div className="p-courses__coach u-mt48">
					<ImageBox
						className="p-courses__coach-icon"
						src={coachData.icon ?? defaultImage}
						round
						objectFit="cover"
					/>
					<div className="p-courses__coach-detail">
						<div className="p-courses__coach-name">{coachData.name}</div>

						<div className="p-courses__coach-game u-mb24">
							{coachData.game?.name ?? "登録なし"}
						</div>
						<div className="p-courses__coach-rating">
							<StarRating
								className="p-courses__coach-rating-star"
								score={averageRating}
							/>
							({reviewNum}件)
						</div>
						<div className="p-courses__coach-sns">
							{coachData.youtube && (
								<Link href={coachData.youtube} target="_blank" rel="noopener noreferrer">
									<ImageBox
										className="p-courses__coach-sns-icon"
										src={youtubeIcon}
										alt="YouTube"
									/>
								</Link>
							)}
							{coachData.x && (
								<Link href={coachData.x} target="_blank" rel="noopener noreferrer">
									<ImageBox
										className="p-courses__coach-sns-icon"
										src={xIcon}
										alt="X"
									/>
								</Link>
							)}
							{coachData.note && (
								<Link href={coachData.note} target="_blank" rel="noopener noreferrer">
									<ImageBox
										className="p-courses__coach-sns-icon"
										src={noteIcon}
										alt="note"
									/>
								</Link>
							)}
						</div>
					</div>
				</div>
			</div>
			<div className="p-courses__section">
				<div className="p-courses__sub-title">自己紹介</div>
				<div className="p-courses__coach-bio">{coachData.bio}</div>
			</div>
			<div className="p-courses__section">
				<div className="p-courses__sub-title">開催中の講座</div>

				<div className="p-courses__list">
					{allCourses.map((course, index) => (
						<CourseCard key={`${course.id}-${index}`} course={course} />
					))}
				</div>

				{hasMoreCourses && (
					<div className="p-courses__load-more">
						<Button
							className="p-courses__load-more-button"
							onClick={loadMoreCourses}
							disabled={isLoadingMore}
						>
							{isLoadingMore ? "読み込み中..." : "もっと見る"}
						</Button>
					</div>
				)}

				{allCourses.length === 0 && courseNum === 0 && (
					<div className="p-courses__no-courses">開催中の講座がありません</div>
				)}
			</div>
		</div>
	);
};

export default Page;
