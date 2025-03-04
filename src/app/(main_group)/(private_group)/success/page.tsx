"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { requestDB } from "@/services/axios";
import { Course, Payment } from "@/type/models";
import { ImageBox } from "@/components/imageBox";
import checkIcon from "@/assets/image/check.svg";
import { Button } from "@/components/button";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const paymentIdStr = searchParams.get("paymentId");
  const paymentId = parseInt(paymentIdStr as string);
  const [paymentData, setPaymentData] = useState<Payment>();
  const [courseData, setCourseData] = useState<Course>();

  const [status, setStatus] = useState<
    "loading" | "success" | "pending" | "invalid"
  >("loading");

  useEffect(() => {
    if (!paymentId) {
      router.push("/about");
      return;
    }

    const fetchPaymentStatus = async () => {
      try {
        const response = await requestDB("payment", "readPaymentById", {
          id: paymentId,
        });
        if (status != "loading") return;
        const payment = response.data;

        if (!payment) {
          setStatus("invalid");
          setTimeout(() => router.push("/about"), 2000);
          return;
        }

        if (payment.status === 2) {
          router.push("/about");
        } else if (payment.status === 0) {
          setStatus("pending");
        } else if (payment.status === 1) {
          setStatus("success");
          await requestDB("payment", "updatePayment", {
            id: paymentId,
            status: 2,
          });
          const { data: course } = await requestDB(
            "course",
            "readCourseByPaymentId",
            { paymentId }
          );
          setCourseData(course);

          setPaymentData(payment);
        }
      } catch (error) {
        console.error("Error fetching payment:", error);
        setStatus("invalid");
        setTimeout(() => router.push("/about"), 2000); // ❌ エラー時も/aboutへ
      }
    };

    fetchPaymentStatus();

    const interval = setInterval(() => {
      if (status === "pending") {
        fetchPaymentStatus();
      }
    }, 3000);

    return () => clearInterval(interval); // クリーンアップ
  }, [paymentId, router, status]);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="p-success__title">🔄 決済情報を確認しています...</div>
        );
      case "pending":
        return (
          <div className="p-success__title">
            ⏳ 決済が完了していない可能性があります。少々お待ちください。
          </div>
        );
      case "success":
        return (
          <>
            <div className="p-success__title-wrapper">
              <ImageBox className="p-success__check" src={checkIcon} />

              <div className="p-success__title">決済が完了しました</div>
            </div>
            <div className="p-success__text">
              講座はチャットを通じて行なっていただきます。コーチと時間や講座内容の把握をし、スムーズに受講できるようにしましょう。
            </div>
            <div className="p-success__title">選択した講座</div>
            <div className="p-success__course">
              <div className="p-success__info">
                <div className="p-success__info-title">{courseData?.title}</div>
                <div className="p-success__info-coach">
                  {courseData?.coach.name}
                </div>
              </div>
              <div className="p-success__info-duration">
                {courseData?.duration}分
              </div>
              <div className="p-success__info-price">
                ￥{courseData?.price.toLocaleString("ja-JP")}
              </div>
            </div>
            <Button
              className="p-success__message"
              onClick={() =>
                router.push(`/courses/course/${courseData?.id}/message`)
              }
            >
              メッセージ
            </Button>
          </>
        );
      case "invalid":
      default:
        return <div>❌ 無効な決済情報です。リダイレクト中...</div>;
    }
  };

  return <div className="p-success">{renderContent()}</div>;
};

export default Page;
