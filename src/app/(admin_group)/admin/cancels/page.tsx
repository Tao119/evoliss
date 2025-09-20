"use client";

import { useState, useEffect } from "react";
import { RefundStatus } from "@/type/models";
import { requestDB } from "@/services/axios";

interface RefundWithDetails {
    id: number;
    reservationId: number | null;
    status: RefundStatus;
    text: string;
    createdAt: Date;
    reservation: {
        id: number;
        customer: {
            id: number;
            name: string;
            email: string;
        };
        course: {
            id: number;
            title: string;
            price: number;
            coach: {
                id: number;
                name: string;
                email: string;
            };
        };
        courseTime: string | null;
    };
}

export default function CancelsPage() {
    const [refunds, setRefunds] = useState<RefundWithDetails[]>([]);
    const [filteredRefunds, setFilteredRefunds] = useState<RefundWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processed">("pending");

    useEffect(() => {
        fetchRefunds();
    }, []);

    useEffect(() => {
        applyFilter();
    }, [refunds, statusFilter]);

    const fetchRefunds = async () => {
        try {
            const response = await requestDB("admin", "getRefunds");
            if (response.success) {
                setRefunds(response.data);
            }
        } catch (error) {
            console.error("Error fetching refunds:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        let filtered = [...refunds];

        if (statusFilter === "pending") {
            filtered = filtered.filter(refund => refund.status === RefundStatus.Created);
        } else if (statusFilter === "processed") {
            filtered = filtered.filter(refund =>
                refund.status === RefundStatus.Accepted || refund.status === RefundStatus.Denied
            );
        }

        // 最新順にソート
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setFilteredRefunds(filtered);
    };

    const handleRefundAction = async (refundId: number, action: "accept" | "deny", refund: RefundWithDetails) => {
        const actionText = action === "accept" ? "承認" : "棄却";
        const coachName = refund.reservation.course.coach.name;
        const courseTitle = refund.reservation.course.title;

        // 確認ポップアップ
        const confirmed = window.confirm(
            `キャンセル申請 #${refundId}を${actionText}します。\n\nコーチ: ${coachName}\n講座: ${courseTitle}\n\nよろしいですか？`
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await requestDB("admin", "processRefund", {
                refundId,
                action
            });

            if (response.success) {
                alert(`キャンセル申請を${actionText}しました`);
                fetchRefunds(); // データを再取得
            } else {
                alert("処理に失敗しました");
            }
        } catch (error) {
            console.error("Error processing refund:", error);
            alert("処理中にエラーが発生しました");
        }
    };

    const getStatusText = (status: RefundStatus) => {
        switch (status) {
            case RefundStatus.Created:
                return "未対応";
            case RefundStatus.Accepted:
                return "承認済み";
            case RefundStatus.Denied:
                return "棄却済み";
            default:
                return "不明";
        }
    };

    const getStatusClass = (status: RefundStatus) => {
        switch (status) {
            case RefundStatus.Created:
                return "is-pending";
            case RefundStatus.Accepted:
                return "is-accepted";
            case RefundStatus.Denied:
                return "is-denied";
            default:
                return "";
        }
    };

    if (loading) {
        return <div className="p-admin-loading">
            <div className="p-admin-loading__spinner"></div>
            <p className="p-admin-loading__text">Loading...</p>
        </div>;
    }

    return (
        <div className="p-admin-cancels">
            <h2 className="p-admin-cancels__title">キャンセル申請一覧</h2>

            {/* フィルター */}
            <div className="p-admin-cancels__controls">
                <div className="p-admin-cancels__filters">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "processed")}
                    >
                        <option value="pending">未対応のみ</option>
                        <option value="processed">対応済みのみ</option>
                        <option value="all">すべて</option>
                    </select>
                </div>
            </div>

            {/* キャンセル申請リスト */}
            <div className="p-admin-cancels__list">
                {filteredRefunds.map(refund => (
                    <div key={refund.id} className="p-admin-cancels__card">
                        <div className="p-admin-cancels__header">
                            <h3 className="p-admin-cancels__id">キャンセル申請 #{refund.id}</h3>
                            <span className={`p-admin-cancels__status ${getStatusClass(refund.status)}`}>
                                {getStatusText(refund.status)}
                            </span>
                        </div>

                        <div className="p-admin-cancels__info">
                            <div className="p-admin-cancels__coach">
                                <h4>申請者（コーチ）</h4>
                                <p><strong>名前:</strong> {refund.reservation.course.coach.name}</p>
                                <p><strong>Email:</strong> {refund.reservation.course.coach.email}</p>
                            </div>

                            <div className="p-admin-cancels__customer">
                                <h4>顧客情報</h4>
                                <p><strong>名前:</strong> {refund.reservation.customer.name}</p>
                                <p><strong>Email:</strong> {refund.reservation.customer.email}</p>
                            </div>

                            <div className="p-admin-cancels__course">
                                <h4>講座情報</h4>
                                <p><strong>講座名:</strong> {refund.reservation.course.title}</p>
                                <p><strong>料金:</strong> ¥{refund.reservation.course.price.toLocaleString()}</p>
                                <p><strong>予約時間:</strong> {refund.reservation.courseTime}</p>
                            </div>
                        </div>

                        <div className="p-admin-cancels__reason">
                            <h4>キャンセル理由</h4>
                            <div className="p-admin-cancels__reason-content">
                                {refund.text}
                            </div>
                        </div>

                        <div className="p-admin-cancels__dates">
                            <p><strong>申請日:</strong> {new Date(refund.createdAt).toLocaleDateString()}</p>
                        </div>

                        {/* アクション（未対応の場合のみ表示） */}
                        {refund.status === RefundStatus.Created && (
                            <div className="p-admin-cancels__actions">
                                <button
                                    className="p-admin-cancels__action-btn is-accept"
                                    onClick={() => handleRefundAction(refund.id, "accept", refund)}
                                >
                                    承認
                                </button>
                                <button
                                    className="p-admin-cancels__action-btn is-deny"
                                    onClick={() => handleRefundAction(refund.id, "deny", refund)}
                                >
                                    棄却
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredRefunds.length === 0 && (
                <div className="p-admin-cancels__no-data">
                    <p>
                        {statusFilter === "pending" ? "未対応のキャンセル申請はありません" :
                            statusFilter === "processed" ? "対応済みのキャンセル申請はありません" :
                                "キャンセル申請はありません"}
                    </p>
                </div>
            )}
        </div>
    );
}