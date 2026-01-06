"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserDataContext, AnimationContext } from "@/app/contextProvider";
import { Button } from "@/components/button";
import Border from "@/components/border";
import { requestDB } from "@/services/axios";

const CourseCreateSuccessPage = () => {
    const { userData } = useContext(UserDataContext)!;
    const animation = useContext(AnimationContext)!;
    const router = useRouter();
    const [hasTimeSlots, setHasTimeSlots] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkTimeSlots();
    }, [userData]);

    const checkTimeSlots = async () => {
        if (!userData) return;

        animation.startAnimation();
        try {
            // コーチのタイムスロットを確認
            const response = await requestDB("coach", "readCoachById", {
                id: userData.id,
            });

            if (response.success && response.data) {
                const timeSlots = response.data.timeSlots || [];
                setHasTimeSlots(timeSlots.length > 0);
            }
        } catch (error) {
            console.error("Error checking time slots:", error);
        } finally {
            setIsLoading(false);
            animation.endAnimation();
        }
    };

    if (!userData || isLoading) {
        return (
            <>
                <div className="p-mypage__title">講座作成完了</div>
                <Border />
            </>
        );
    }

    // タイムスロットがある場合は講座一覧へリダイレクト
    if (hasTimeSlots) {
        router.push("/mypage/coach/list");
        return null;
    }

    return (
        <>
            <div className="p-mypage__title">講座作成完了</div>
            <Border />

            <div className="p-create-success">
                <div className="p-create-success__content">
                    <h2 className="p-create-success__heading">
                        講座の作成が完了しました！
                    </h2>

                    <div className="p-create-success__message">
                        <p>次のステップとして、コーチング可能な日程を登録しましょう。</p>
                        <p>
                            マイカレンダーから、受講者が予約できる時間枠を設定できます。
                        </p>
                    </div>

                    <div className="p-create-success__buttons">
                        <Button
                            className="p-create-success__button -primary"
                            onClick={() => router.push("/mypage/calendar")}
                        >
                            カレンダーページへ
                        </Button>

                        <Button
                            className="p-create-success__button -secondary"
                            onClick={() => router.push("/mypage/coach/list")}
                        >
                            後で設定する
                        </Button>
                    </div>

                    <div className="p-create-success__note">
                        <p>※日程を登録しないと、受講者は予約できません</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CourseCreateSuccessPage;
