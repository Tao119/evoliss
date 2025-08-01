import defaultImage from "@/assets/image/picture-icon.svg";
import { ImageBox } from "@/components/imageBox";
import type { Course, Reservation } from "@/type/models";
import { reservationStatus } from "@/type/models";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import crossImage from "@/assets/image/cross-red.svg"

dayjs.locale("ja");

interface Props {
    course?: Course;
    reservation: Reservation;
    children?: React.ReactNode;
}

export const CourseCardCoachUpcoming: React.FC<Props> = ({ course, reservation, children }) => {
    const router = useRouter();

    let dateTime = null;
    // courseTimeがある場合はそれを使用、ない場合はtimeSlotsから取得（互換性のため）
    if (reservation.courseTime) {
        // courseTimeは "YYYY/MM/DD HH:mm~HH:mm" 形式
        const [datePart, timePart] = reservation.courseTime.split(' ');
        const [startTime, endTime] = timePart.split('~');
        const dateObj = dayjs(datePart + ' ' + startTime);

        dateTime = {
            date: dateObj.format("M月D日（ddd）"),
            startTime: startTime,
            endTime: endTime
        };
    } else if (reservation?.timeSlots && reservation.timeSlots.length > 0) {
        // 互換性のために残しておく
        const firstSlot = reservation.timeSlots[0];
        const lastSlot = reservation.timeSlots[reservation.timeSlots.length - 1];
        dateTime = {
            date: dayjs(firstSlot.dateTime).format("M月D日（ddd）"),
            startTime: dayjs(firstSlot.dateTime).format("HH:mm"),
            endTime: dayjs(lastSlot.dateTime).add(30, "minute").format("HH:mm")
        };
    }

    const displayCourse = course || reservation?.course;
    if (!displayCourse) return null;

    let canReschedule = false;
    const firstSlot = reservation.timeSlots?.[0];
    if (firstSlot) {
        const daysUntilClass = Math.floor(
            (new Date(firstSlot.dateTime).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );
        canReschedule = daysUntilClass >= 5;
    }

    // キャンセル申請中かどうかをチェック
    const isCancelRequested = reservation.status === reservationStatus.CancelRequestedByCoach;

    // キャンセル済みかどうかを判定
    const isCanceled = reservation.status === reservationStatus.Canceled ||
        reservation.status === reservationStatus.CanceledByCoach ||
        reservation.status === reservationStatus.CancelRequestedByCoach;

    return (
        <>
            <div className={`p-course-card ${isCanceled ? '-canceled' : ''}`}>

                <div className="p-course-card__coach">
                    <div className="p-course-card__coach-name">
                        生徒：{reservation.customer.name || "Unknown"}
                    </div>
                    <ImageBox
                        className="p-course-card__coach-icon"
                        src={reservation.customer.icon ?? defaultImage}
                        objectFit="cover"
                        round
                    />
                </div>
                <div
                    className={`p-course-card__item -low ${isCanceled ? "-canceled" : ""}`}
                    style={{ cursor: "default" }}
                // onClick={() => router.push(`/courses/course/${displayCourse.id}`)}
                >
                    <div className="p-course-card__left"
                        style={{ gap: "10px" }}>
                        <div className="p-course-card__game">{displayCourse.game?.name}</div>
                        <ImageBox
                            className="p-course-card__image"
                            src={displayCourse.image ?? defaultImage}
                            objectFit="cover"
                        />
                        <div className="p-course-card__title" style={{ fontSize: "14px" }}>{displayCourse.title}</div>
                    </div>
                    <div className="p-course-card__right"
                        style={{
                            justifyContent: "center"
                            , gap: "10px",
                            alignItems: "center"
                        }}>

                        <div className="p-course-card__date">{dateTime?.date}</div>
                        <div className="p-course-card__time">
                            {dateTime?.startTime} ~ {dateTime?.endTime}
                        </div>
                        {!isCanceled && <div className="p-course-card__text u-re u-mb16">必要事項を連絡して下さい</div>}
                        <div className="p-course-card__tags">
                            {reservation.status !== reservationStatus.Canceled && reservation.status !== reservationStatus.CanceledByCoach && (
                                <>
                                    <div className="p-course-card__button"
                                        onClick={() => router.push(`/mypage/message/${reservation.room?.roomKey}`)}>
                                        <div className="p-course-card__tag-text">メッセージ</div>
                                    </div>
                                    <div
                                        className={`p-course-card__button ${isCancelRequested ? '-disabled' : ''}`}
                                        onClick={() => {
                                            if (!isCancelRequested) {
                                                router.push(`/mypage/coach/upcoming/cancel?reservationId=${reservation.id}`);
                                            }
                                        }}
                                        style={{
                                            opacity: isCancelRequested ? 0.5 : 1,
                                            cursor: isCancelRequested ? 'not-allowed' : 'pointer'
                                        }}>
                                        <div className="p-course-card__tag-text -flex">
                                            {isCancelRequested ? 'キャンセル申請中' : <><ImageBox className="p-course-card__tag-image" src={crossImage} />キャンセル申請</>}
                                        </div>
                                    </div>
                                </>
                            )}
                            {isCanceled && (
                                <div className="p-course-card__text">
                                    {
                                        reservation.status === reservationStatus.Canceled ? '生徒キャンセル済み' :
                                            reservation.status === reservationStatus.CanceledByCoach ? 'コーチキャンセル済み' :
                                                'キャンセル申請中'
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                    {children}
                </div>
            </div></>
    );
};
