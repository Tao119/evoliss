"use client";
import { useContext, useEffect, useRef, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import UserIcon from "@/components/userIcon";
import { User } from "@/type/models";
import { requestDB } from "@/services/axios";
import { OverLay } from "@/components/overlay";
import { IconButton } from "@/components/iconButton";
import closeImage from "@/assets/image/cross.svg";
import { AccountTypeString } from "../mypage/dashboard";
import { Button } from "@/components/button";
import { InputBox } from "@/components/inputBox";

const Page = () => {
  const path = usePathname();
  const [showDetail, setShowDetail] = useState<number>();
  const [amount, setAmount] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const animation = useContext(AnimationContext)!;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    animation.startAnimation();
    requestDB("user", "readUsers").then((response) => {
      if (response.success) {
        setUsers(response.data);
      }
      animation.endAnimation();
    });
  };

  const handleSubmit = async () => {
    if (amount == 0 || !showDetail) {
      return;
    }
    const data = users.find((m) => m.id == showDetail);
    if (!data) return;
    if (
      Math.floor(
        data.courses
          .flatMap((course) =>
            course.reservations.map((reservation) => course.price)
          )
          .reduce((sum, price) => sum + price, 0) * 0.9
      ) -
        data.userPayment.reduce((sum, payment) => sum + payment.amount, 0) -
        amount <
      0
    ) {
      alert("入金金額が上限を超えています");
      return;
    }
    if (
      !confirm("入金済みであることを確認して下さい。本当に入金済みですか？")
    ) {
      return;
    }
    animation.startAnimation();
    await requestDB("user", "savePayment", { userId: showDetail, amount }).then(
      (response) => {
        if (!response.success) {
          alert(response.error ?? "失敗しました");
        }
      }
    );
    setAmount(0);
    await fetchData();
    animation.endAnimation();
  };

  return (
    <div className="p-admin">
      <div className="p-admin__title">管理者ページ</div>
      <div className="p-admin__sub-title">ユーザー一覧</div>
      {users.map((m, i) => (
        <div className="p-admin__user-profile" key={i}>
          <UserIcon className="p-admin__user-icon" src={m.icon} />
          <div className="p-admin__user-info">
            <div className="p-admin__user-name">{m.name}</div>
            <div className="p-admin__user-email">{m.email}</div>
          </div>
          <div
            className="p-admin__user-detail"
            onClick={() => {
              setShowDetail(m.id);
              setAmount(0);
            }}
          >
            詳細
          </div>
        </div>
      ))}
      {(() => {
        if (showDetail) {
          const data = users.find((m) => m.id == showDetail);
          if (!data) return;
          return (
            <>
              <OverLay
                onClick={() => setShowDetail(undefined)}
                className="p-admin__overlay"
              />
              <div className="p-admin__detail">
                <IconButton
                  className="p-admin__detail-close"
                  src={closeImage}
                  onClick={() => setShowDetail(undefined)}
                />
                <UserIcon className="p-admin__detail-icon" src={data.icon} />
                <div className="p-admin__detail-section">
                  <div className="p-admin__detail-real-name">{data.name}</div>
                </div>

                <div className="p-admin__detail-section">
                  <div className="p-admin__detail-email">{data.email}</div>
                </div>
                <div className="p-admin__detail-section">
                  {data.paymentAccount ? (
                    <div className="p-admin__detail-payment-account">
                      {data.paymentAccount.bankName}/{" "}
                      {data.paymentAccount.branchName}/{" "}
                      {AccountTypeString[data.paymentAccount.accountType]}/{" "}
                      {data.paymentAccount.accountNumber}/{" "}
                      {data.paymentAccount.accountHolder}
                    </div>
                  ) : (
                    <div className="p-admin__detail-payment-account">
                      口座情報が登録されていません　
                    </div>
                  )}
                </div>
                <div className="p-admin__detail-section">
                  売上金額:
                  {data.courses
                    .flatMap((course) =>
                      course.reservations.map((reservation) => course.price)
                    )
                    .reduce((sum, price) => sum + price, 0)}
                  円(
                  {Math.floor(
                    data.courses
                      .flatMap((course) =>
                        course.reservations.map((reservation) => course.price)
                      )
                      .reduce((sum, price) => sum + price, 0) * 0.9
                  )}
                  円)
                </div>
                <div className="p-admin__detail-section">
                  入金済み金額:
                  {data.userPayment.reduce(
                    (sum, payment) => sum + payment.amount,
                    0
                  )}
                  円
                </div>
                <div className="p-admin__detail-section">
                  残高:
                  {Math.floor(
                    data.courses
                      .flatMap((course) =>
                        course.reservations.map((reservation) => course.price)
                      )
                      .reduce((sum, price) => sum + price, 0) * 0.9
                  ) -
                    data.userPayment.reduce(
                      (sum, payment) => sum + payment.amount,
                      0
                    )}
                  円
                </div>
                <div className="p-admin__detail-section">
                  <InputBox
                    className="p-admin__detail-input"
                    value={amount}
                    type="number"
                    onChange={(e) => setAmount(parseInt(e.target.value))}
                  />
                  <Button
                    className="p-admin__detail-submit"
                    onClick={handleSubmit}
                  >
                    入金登録
                  </Button>
                </div>
              </div>
            </>
          );
        }
      })()}
    </div>
  );
};

export default Page;
