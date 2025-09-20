"use client";

import { useState, useEffect } from "react";
import { User, UserPayment, PaymentAccount } from "@/type/models";
import { requestDB } from "@/services/axios";

interface UserWithStats extends User {
    totalSales: number;
    thisMonthSales: number;
    unpaidAmount: number;
    paymentAccount?: PaymentAccount;
    userPayment: UserPayment[];
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserWithStats[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<"latest" | "sales">("latest");
    const [filterCoachesWithSales, setFilterCoachesWithSales] = useState(true);
    const [filterUnpaidThisMonth, setFilterUnpaidThisMonth] = useState(true);
    const [paymentAmount, setPaymentAmount] = useState<{ [userId: number]: string }>({});

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        applyFiltersAndSort();
    }, [users, sortBy, filterCoachesWithSales, filterUnpaidThisMonth]);

    const fetchUsers = async () => {
        try {
            const response = await requestDB("admin", "getUsersWithStats");
            if (response.success) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFiltersAndSort = () => {
        let filtered = [...users];

        // フィルター適用
        if (filterCoachesWithSales) {
            filtered = filtered.filter(user => user.totalSales > 0);
        }

        if (filterUnpaidThisMonth) {
            filtered = filtered.filter(user => user.unpaidAmount > 0);
        }

        // ソート適用
        if (sortBy === "latest") {
            filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (sortBy === "sales") {
            filtered.sort((a, b) => b.totalSales - a.totalSales);
        }

        setFilteredUsers(filtered);
    };

    const handlePaymentRegistration = async (userId: number) => {
        const amount = parseFloat(paymentAmount[userId] || "0");
        const user = users.find(u => u.id === userId);

        if (amount <= 0) {
            alert("有効な金額を入力してください");
            return;
        }

        if (!user) {
            alert("ユーザー情報が見つかりません");
            return;
        }

        if (amount > user.unpaidAmount) {
            alert(`入金額は未振込金額（¥${user.unpaidAmount.toLocaleString()}）以下で入力してください`);
            return;
        }

        // 確認ポップアップ
        const confirmed = window.confirm(
            `${user.name || user.email}さんに¥${amount.toLocaleString()}の入金登録を行います。\n\nよろしいですか？`
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await requestDB("admin", "registerPayment", {
                userId,
                amount
            });

            if (response.success) {
                alert("入金登録が完了しました");
                setPaymentAmount(prev => ({ ...prev, [userId]: "" }));
                fetchUsers(); // データを再取得
            } else {
                alert("入金登録に失敗しました");
            }
        } catch (error) {
            console.error("Error registering payment:", error);
            alert("入金登録中にエラーが発生しました");
        }
    };

    if (loading) {
        return <div className="p-admin-loading">
            <div className="p-admin-loading__spinner"></div>
            <p className="p-admin-loading__text">Loading...</p>
        </div>;
    }

    return (
        <div className="p-admin-users">
            <h2 className="p-admin-users__title">ユーザー一覧</h2>

            {/* フィルターとソート */}
            <div className="p-admin-users__controls">
                <div className="p-admin-users__filters">
                    <label className="p-admin-users__filter-label">
                        <input
                            type="checkbox"
                            checked={filterCoachesWithSales}
                            onChange={(e) => setFilterCoachesWithSales(e.target.checked)}
                        />
                        売上のあるコーチのみ
                    </label>
                    <label className="p-admin-users__filter-label">
                        <input
                            type="checkbox"
                            checked={filterUnpaidThisMonth}
                            onChange={(e) => setFilterUnpaidThisMonth(e.target.checked)}
                        />
                        今月未入金のみ
                    </label>
                </div>
                <div className="p-admin-users__sort">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "latest" | "sales")}>
                        <option value="latest">最新順</option>
                        <option value="sales">売上順</option>
                    </select>
                </div>
            </div>

            {/* ユーザーリスト */}
            <div className="p-admin-users__list">
                {filteredUsers.map(user => (
                    <div key={user.id} className="p-admin-users__card">
                        <div className="p-admin-users__info">
                            <h3>{user.name || "名前未設定"}</h3>
                            <p>Email: {user.email}</p>
                            <p>登録日: {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="p-admin-users__sales">
                            <p>累計売上: ¥{user.totalSales.toLocaleString()}</p>
                            <p>今月売上: ¥{user.thisMonthSales.toLocaleString()}</p>
                            <p>未振込金額: ¥{user.unpaidAmount.toLocaleString()}</p>
                        </div>

                        {/* 振込口座情報 */}
                        <div className="p-admin-users__bank">
                            {user.paymentAccount ? (
                                <div>
                                    <h4>振込口座情報</h4>
                                    <p>銀行名: {user.paymentAccount.bankName}</p>
                                    <p>支店名: {user.paymentAccount.branchName}</p>
                                    <p>口座種別: {user.paymentAccount.accountType === 0 ? "普通" : "当座"}</p>
                                    <p>口座番号: {user.paymentAccount.accountNumber}</p>
                                    <p>口座名義: {user.paymentAccount.accountHolder}</p>
                                </div>
                            ) : (
                                <p>振込口座未登録</p>
                            )}
                        </div>

                        {/* 入金登録 */}
                        <div className="p-admin-users__payment">
                            <h4>入金登録</h4>
                            <div className="p-admin-users__payment-input">
                                <input
                                    type="number"
                                    placeholder={`入金額（最大: ¥${user.unpaidAmount.toLocaleString()}）`}
                                    value={paymentAmount[user.id] || ""}
                                    max={user.unpaidAmount}
                                    onChange={(e) => setPaymentAmount(prev => ({
                                        ...prev,
                                        [user.id]: e.target.value
                                    }))}
                                />
                                <button
                                    onClick={() => handlePaymentRegistration(user.id)}
                                    disabled={user.unpaidAmount === 0}
                                >
                                    入金登録
                                </button>
                            </div>
                            {user.unpaidAmount === 0 && (
                                <p className="p-admin-users__payment-note">未振込金額がありません</p>
                            )}
                        </div>

                        {/* 入金履歴 */}
                        {user.userPayment && user.userPayment.length > 0 && (
                            <div className="p-admin-users__history">
                                <h4>入金履歴</h4>
                                {user.userPayment.slice(0, 3).map(payment => (
                                    <div key={payment.id} className="p-admin-users__history-item">
                                        <span>¥{payment.amount.toLocaleString()}</span>
                                        <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}