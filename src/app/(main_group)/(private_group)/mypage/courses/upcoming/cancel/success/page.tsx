"use client";

import { UserDataContext } from "@/app/contextProvider";
import checkIcon from "@/assets/image/check.svg";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import { requestDB } from "@/services/axios";
import { Course, Reservation } from "@/type/models";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { CourseCardReschedule } from "../../reschedule/courseCardReschedule";

const Page = () => {
	const router = useRouter();
	const searchParams = useSearchParams()!;
	const { userData } = useContext(UserDataContext)!;
	const reservationIdStr = searchParams.get("reservationId");
	const reservationId = Number.parseInt(reservationIdStr as string);
	const [reservationData, setReservationData] = useState<Reservation>();
	const [courseData, setCourseData] = useState<Course>();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!reservationId || isNaN(reservationId) || !userData) {
			router.push("/mypage/courses/upcoming");
			return;
		}
		fetchReservationAndCourse();
	}, [reservationId, userData, router]);


	const fetchReservationAndCourse = async () => {
		try {
			const response = await requestDB("reservation", "readReservationById", {
				id: reservationId,
			});

			const reservation: Reservation = response.data;

			if (!reservation) {
				router.push("/mypage/courses/upcoming");
				return;
			}

			// ユーザーIDの確認
			if (reservation.customerId !== userData?.id) {
				router.push("/mypage/courses/upcoming");
				return;
			}

			setReservationData(reservation);

			const courseResponse = await requestDB("course", "readCourseById", {
				id: reservation.courseId,
			});
			if (courseResponse.success) {
				setCourseData(courseResponse.data);
			}

			setIsLoading(false);
		} catch (error) {
			console.error("Error fetching data:", error);
			router.push("/mypage/courses/upcoming");
		}
	};

	if (isLoading || !reservationData || !courseData) {
		return <div className="p-success"></div>;
	}


	return (
		<div className="p-success l-page">
			<div className="p-success__section">
				<div className="p-success__title">キャンセル完了</div>
				<Border />
			</div>
			<div className="p-success__text">
				キャンセルが完了しました
			</div>
			{/* <CourseCardReschedule reservation={reservationData} course={courseData} /> */}
			{/* <ImageBox
				src={checkIcon}
				className="p-success__icon"
			/> */}
			<Button
				className="p-success__button"
				onClick={() => router.push("/mypage/courses/upcoming")}
			>
				受講予定の講座へ戻る
			</Button>
		</div>
	);
};

export default Page;
