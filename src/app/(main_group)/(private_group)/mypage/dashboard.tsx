"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { Button } from "@/components/button";
import { InputBox } from "@/components/inputBox";
import { useRouter } from "next/navigation";
import closeImage from "@/assets/image/cross.svg";
import { IconButton } from "@/components/iconButton";
import { Filter } from "@/components/filter";
import { AccountType, PaymentAccount } from "@/type/models";
import { requestDB } from "@/services/axios";
import dayjs from "dayjs";
import { MultilineInput } from "@/components/multilineInput";

export const AccountTypeString = ["普通預金", "当座預金"];

const Dashboard = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const animation = useContext(AnimationContext)!;
  const router = useRouter();
  const [showEditAccount, setShowPaymentAccount] = useState(false);
  const [showRefund, setShowRefund] = useState<number>();
  const [refundMessage, setRefundMessage] = useState("");
  const [editingPaymentAccount, setEditingPaymentAccount] =
    useState<PaymentAccount>();
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount>();

  const onReady = userData;

  useEffect(() => {
    animation.startAnimation();
  }, []);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  useEffect(() => {
    if (userData) {
      setPaymentAccount(
        userData?.paymentAccount.length > 0
          ? userData?.paymentAccount[0]
          : undefined
      );
    }
  }, [userData]);

  if (!onReady) {
    return <>Loading...</>;
  }

  const handleSubmit = async () => {
    if (
      editingPaymentAccount?.bankName === undefined ||
      editingPaymentAccount?.branchName === undefined ||
      editingPaymentAccount?.accountType === undefined ||
      editingPaymentAccount?.accountNumber === undefined ||
      editingPaymentAccount?.accountHolder === undefined
    ) {
      alert("有効なデータを入力して下さい");

      return;
    }
    animation.startAnimation();
    await requestDB("user", "updatePaymentAccount", {
      ...editingPaymentAccount,
      userId: userData.id,
    }).then((response) => {
      if (!response.success) {
        animation.endAnimation();
        return;
      } else {
        setEditingPaymentAccount(undefined);
        setShowPaymentAccount(false);
        fetchUserData();
        animation.endAnimation();
      }
    });
  };
  const handleRefund = async () => {
    if (refundMessage.trim() == "" || showRefund == undefined) {
      alert("有効なデータを入力して下さい");

      return;
    }
    animation.startAnimation();
    await requestDB("reservation", "createRefund", {
      reservationId: showRefund,
      customerId: userData.id,
      text: refundMessage,
    }).then((response) => {
      if (!response.success) {
        animation.endAnimation();
        return;
      } else {
        setRefundMessage("");
        setShowRefund(undefined);
        fetchUserData();
        animation.endAnimation();
      }
    });
  };

  return (
    <div className="p-coach">
      {paymentAccount ? (
        <div className="p-coach__payment-account">
          <div className="p-coach__payment-account-title">口座情報</div>

          <div className="p-coach__payment-account-info">
            {paymentAccount.bankName}/ {paymentAccount.branchName}/{" "}
            {AccountTypeString[paymentAccount.accountType]}/{" "}
            {paymentAccount.accountNumber}/ {paymentAccount.accountHolder}
          </div>
          <Button
            className="p-coach__payment-account-button"
            onClick={() => {
              setShowPaymentAccount(true);
              setEditingPaymentAccount(paymentAccount);
            }}
          >
            編集
          </Button>
        </div>
      ) : (
        <div className="p-coach__payment-account">
          <Button onClick={() => setShowPaymentAccount(true)}>
            口座情報を登録する
          </Button>
        </div>
      )}
      <div className="p-coach__courses-panel">
        <div className="p-coach__courses-title">受講予定講座一覧</div>
        <div className="p-coach__course-list -high">
          {userData.reservations
            .filter(
              (reservation) =>
                new Date(reservation.schedule.startTime).getTime() >=
                new Date().getTime()
            )
            .sort((a, b) =>
              new Date(a.schedule.startTime).getTime() <=
              new Date(b.schedule.startTime).getTime()
                ? 1
                : -1
            )
            .map((reservation) => (
              <div
                key={reservation.id}
                className="p-coach__course-item -high"
                onClick={() =>
                  reservation.roomId
                    ? router.push(`/message/${reservation.roomId}`)
                    : null
                }
              >
                <div className="p-coach__course-title">
                  タイトル: {reservation.course.title}
                </div>
                <div className="p-coach__course-title">
                  開始時間:{" "}
                  {dayjs(new Date(reservation.schedule.startTime)).format(
                    "YYYY年M月D日 hh:mm~"
                  )}
                </div>
                <div className="p-coach__course-title">
                  コーチ: {reservation.course.coach.name}
                </div>
                <Button
                  className="p-coach__course-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRefund(reservation.id);
                  }}
                >
                  キャンセル申請
                </Button>
              </div>
            ))}
        </div>
      </div>
      <div className="p-coach__course-sub-title">
        売上金額:
        {userData.courses
          .flatMap((course) =>
            course.reservations.map((reservation) => course.price)
          )
          .reduce((sum, price) => sum + price, 0) -
          userData.userPayment.reduce(
            (sum, payment) => sum + payment.amount,
            0
          )}
        円
      </div>
      <div className="p-coach__courses-panel">
        <div className="p-coach__courses-title">開催予定講座一覧</div>
        <div className="p-coach__course-list">
          {userData.courses.flatMap((course) =>
            course.reservations
              .filter(
                (reservation) =>
                  new Date(reservation.schedule.startTime).getTime() >
                  new Date().getTime()
              )
              .sort((a, b) =>
                new Date(a.schedule.startTime).getTime() >=
                new Date(b.schedule.startTime).getTime()
                  ? 1
                  : -1
              )
              .map((reservation) => (
                <div
                  key={reservation.id}
                  className="p-coach__course-item"
                  onClick={() =>
                    reservation.roomId
                      ? router.push(`/message/${reservation.roomId}`)
                      : null
                  }
                >
                  <div className="p-coach__course-title">
                    タイトル: {course.title}
                  </div>
                  <div className="p-coach__course-title">
                    開始時間:{" "}
                    {dayjs(new Date(reservation.schedule.startTime)).format(
                      "YYYY年M月D日 hh:mm~"
                    )}
                  </div>
                  <div className="p-coach__course-title">
                    予約者名: {reservation.customer.name}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
      <div className="p-coach__courses-panel">
        <div className="p-coach__courses-title">開催済み講座一覧</div>
        <div className="p-coach__course-list">
          {userData.courses.flatMap((course) =>
            course.reservations
              .filter(
                (reservation) =>
                  new Date(reservation.schedule.startTime).getTime() <=
                  new Date().getTime()
              )
              .sort((a, b) =>
                new Date(a.schedule.startTime).getTime() <=
                new Date(b.schedule.startTime).getTime()
                  ? 1
                  : -1
              )
              .map((reservation) => (
                <div
                  key={reservation.id}
                  className="p-coach__course-item"
                  onClick={() =>
                    reservation.roomId
                      ? router.push(`/message/${reservation.roomId}`)
                      : null
                  }
                >
                  <div className="p-coach__course-title">
                    タイトル: {course.title}
                  </div>
                  <div className="p-coach__course-title">
                    開始時間:{" "}
                    {dayjs(new Date(reservation.schedule.startTime)).format(
                      "YYYY年M月D日 hh:mm~"
                    )}
                  </div>
                  <div className="p-coach__course-title">
                    予約者名: {reservation.customer.name}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {showEditAccount && (
        <div className="p-coach__edit-payment-account">
          <IconButton
            src={closeImage}
            onClick={() => {
              setShowPaymentAccount(false);
              setEditingPaymentAccount(paymentAccount);
            }}
            className="p-coach__edit-payment-account-close"
          />
          <div className="p-coach__edit-payment-account-section">
            <div className="p-coach__edit-payment-account-label">銀行名</div>
            <InputBox
              className="p-coach__edit-payment-account-input"
              value={editingPaymentAccount?.bankName}
              onChange={(e) => {
                setEditingPaymentAccount((prev) => ({
                  ...prev!,
                  bankName: e.target.value as string,
                }));
              }}
            />
          </div>
          <div className="p-coach__edit-payment-account-section">
            <div className="p-coach__edit-payment-account-label">支店名</div>
            <InputBox
              className="p-coach__edit-payment-account-input"
              value={editingPaymentAccount?.branchName}
              onChange={(e) => {
                setEditingPaymentAccount((prev) => ({
                  ...prev!,
                  branchName: e.target.value as string,
                }));
              }}
            />
          </div>
          <div className="p-coach__edit-payment-account-section">
            <div className="p-coach__edit-payment-account-label">口座種別</div>

            <Filter
              includeDefault
              label="預金種別を選択"
              className="p-coach__edit-payment-account-input"
              selectedValue={editingPaymentAccount?.accountType}
              options={Object.values(AccountType)
                .filter((value) => typeof value === "number")
                .map((a) => ({
                  label: AccountTypeString[a],
                  value: a,
                }))}
              onChange={(value: any) => {
                setEditingPaymentAccount((prev) => ({
                  ...prev!,
                  accountType: parseInt(value),
                }));
              }}
            />
          </div>
          <div className="p-coach__edit-payment-account-section">
            <div className="p-coach__edit-payment-account-label">口座番号</div>
            <InputBox
              className="p-coach__edit-payment-account-input"
              value={editingPaymentAccount?.accountNumber}
              type="nuimber"
              onChange={(e) => {
                setEditingPaymentAccount((prev) => ({
                  ...prev!,
                  accountNumber: e.target.value as string,
                }));
              }}
            />
          </div>
          <div className="p-coach__edit-payment-account-section">
            <div className="p-coach__edit-payment-account-label">口座名義</div>
            <InputBox
              className="p-coach__edit-payment-account-input"
              value={editingPaymentAccount?.accountHolder}
              onChange={(e) => {
                setEditingPaymentAccount((prev) => ({
                  ...prev!,
                  accountHolder: e.target.value as string,
                }));
              }}
            />
          </div>
          <Button
            className="p-coach__edit-payment-account-submit"
            onClick={handleSubmit}
          >
            保存
          </Button>
        </div>
      )}
      {(() => {
        if (!showRefund) return;
        const data = userData.reservations.find((r) => r.id == showRefund);
        if (!data) return;
        return (
          <div className="p-coach__edit-payment-account">
            <IconButton
              src={closeImage}
              onClick={() => {
                setShowRefund(undefined);
                setRefundMessage("");
              }}
              className="p-coach__edit-payment-account-close"
            />
            <div>キャンセルする講座</div>
            <div>コース名:{data.course.title}</div>
            <div>コーチ:{data.course.coach.name}</div>
            <div>
              開始時間:{" "}
              {dayjs(new Date(data.schedule.startTime)).format(
                "YYYY年M月D日 hh:mm~"
              )}
            </div>
            <MultilineInput
              value={refundMessage}
              onChange={(v) => setRefundMessage(v.target.value)}
            />
            <Button
              className="p-coach__edit-payment-account-submit"
              onClick={handleRefund}
            >
              送信
            </Button>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
