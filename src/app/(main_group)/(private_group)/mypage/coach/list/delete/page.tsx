"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { Button } from "@/components/button";
import { requestDB } from "@/services/axios";
import { useContext, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Border from "@/components/border";
// import { ImageBox } from "@/components/imageBox";
import type { Course } from "@/type/models";
import { CourseCardDelete } from "./courseCardDelete";

const CoachDeletePage = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const router = useRouter();
	const searchParams = useSearchParams()!;
	const courseId = searchParams.get("courseId");

	const [course, setCourse] = useState<Course | null>(null);
	const [isLoading, setIsLoading] = useState(true);



	const fetchCourse = useCallback(async () => {
		try {
			const response = await requestDB("course", "readCourseById", {
				id: Number.parseInt(courseId!)
			});

			if (!response.success) {
				alert("講座情報の取得に失敗しました");
				router.push("/mypage/coach/list");
				return;
			}

			// 権限チェック
			if (response.data.coachId !== userData?.id) {
				alert("この講座を削除する権限がありません");
				router.push("/mypage/coach/list");
				return;
			}

			setCourse(response.data);
		} catch (error) {
			console.error("Error fetching course:", error);
			alert("講座情報の取得中にエラーが発生しました");
			router.push("/mypage/coach/list");
		} finally {
			setIsLoading(false);
			animation.endAnimation();
		}
	}, [courseId, userData?.id, router, animation]);
	useEffect(() => {
		animation.startAnimation();
		if (!courseId) {
			alert("講座IDが指定されていません");
			router.push("/mypage/coach/list");
			return;
		}
		fetchCourse();
	}, [courseId, animation, fetchCourse, router]);

	const handleDelete = async () => {
		if (!confirm("本当に完全削除してよろしいですか？\nこの操作は取り消せません。")) {
			return;
		}

		animation.startAnimation();

		try {
			const response = await requestDB("course", "deleteCourse", {
				id: Number.parseInt(courseId!)
			});

			if (response.success) {
				router.push(`/mypage/coach/list/delete/success?courseId=${courseId}`);
			} else {
				alert("講座の削除に失敗しました");
			}
		} catch (error) {
			console.error("Error deleting course:", error);
			alert("講座の削除中にエラーが発生しました");
		} finally {
			animation.endAnimation();
		}
	};

	// const handleCancel = () => {
	// 	router.push("/mypage/coach/list");
	// };

	if (!userData || isLoading) {
		return (
			<>
				<div className="p-mypage__title">講座完全削除確認</div>
				<Border />
			</>
		);
	}

	if (!course) {
		return (
			<>
				<div className="p-mypage__title">講座完全削除確認</div>
				<Border />
				<div className="p-mypage__content">
					<p>講座情報が見つかりませんでした。</p>
				</div>
			</>
		);
	}

	return (
		<>
			<div className="p-mypage__title">講座完全削除確認</div>
			<Border />

			<div className="p-delete">

				<CourseCardDelete course={course} />
				<div className="p-delete__warning">
					<h2 className="p-delete__warning-title">本当に完全削除して<br />よろしいですか？</h2>
					<p className="p-delete__warning-text">
						開講した講座からも完全に削除されます。
					</p>
				</div>

				<div className="p-delete__buttons">
					<Button
						className="p-delete__button -delete"
						onClick={handleDelete}
					>
						講座を完全に削除する
					</Button>
				</div>
			</div>
		</>
	);
};

export default CoachDeletePage;