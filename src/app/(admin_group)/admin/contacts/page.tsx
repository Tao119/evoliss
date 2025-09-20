"use client";

import { useState, useEffect } from "react";
import { Contact, ContactStatus } from "@/type/models";
import { requestDB } from "@/services/axios";

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processed">("pending");

    useEffect(() => {
        fetchContacts();
    }, []);

    useEffect(() => {
        applyFilter();
    }, [contacts, statusFilter]);

    const fetchContacts = async () => {
        try {
            const response = await requestDB("admin", "getContacts");
            if (response.success) {
                setContacts(response.data);
            }
        } catch (error) {
            console.error("Error fetching contacts:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        let filtered = [...contacts];

        if (statusFilter === "pending") {
            filtered = filtered.filter(contact => contact.status === ContactStatus.Pending);
        } else if (statusFilter === "processed") {
            filtered = filtered.filter(contact =>
                contact.status === ContactStatus.InProgress || contact.status === ContactStatus.Resolved
            );
        }

        // 最新順にソート
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setFilteredContacts(filtered);
    };

    const handleStatusUpdate = async (contactId: number, newStatus: ContactStatus, contactName: string) => {
        const statusText = getStatusText(newStatus);

        // 確認ポップアップ
        const confirmed = window.confirm(
            `${contactName}さんのお問い合わせを「${statusText}」に変更します。\n\nよろしいですか？`
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await requestDB("admin", "updateContactStatus", {
                contactId,
                status: newStatus
            });

            if (response.success) {
                alert("ステータスを更新しました");
                fetchContacts(); // データを再取得
            } else {
                alert("ステータス更新に失敗しました");
            }
        } catch (error) {
            console.error("Error updating contact status:", error);
            alert("ステータス更新中にエラーが発生しました");
        }
    };

    const getStatusText = (status: ContactStatus) => {
        switch (status) {
            case ContactStatus.Pending:
                return "未対応";
            case ContactStatus.InProgress:
                return "対応中";
            case ContactStatus.Resolved:
                return "対応済み";
            default:
                return "不明";
        }
    };

    const getStatusClass = (status: ContactStatus) => {
        switch (status) {
            case ContactStatus.Pending:
                return "is-pending";
            case ContactStatus.InProgress:
                return "is-in-progress";
            case ContactStatus.Resolved:
                return "is-resolved";
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
        <div className="p-admin-contacts">
            <h2 className="p-admin-contacts__title">お問い合わせ一覧</h2>

            {/* フィルター */}
            <div className="p-admin-contacts__controls">
                <div className="p-admin-contacts__filters">
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

            <div className="p-admin-contacts__list">
                {filteredContacts.map(contact => (
                    <div key={contact.id} className="p-admin-contacts__card">
                        <div className="p-admin-contacts__header">
                            <h3 className="p-admin-contacts__name">{contact.name}</h3>
                            <span className={`p-admin-contacts__status ${getStatusClass(contact.status)}`}>
                                {getStatusText(contact.status)}
                            </span>
                        </div>

                        <div className="p-admin-contacts__info">
                            <p><strong>Email:</strong> {contact.email}</p>
                            <p><strong>受信日:</strong> {new Date(contact.createdAt).toLocaleDateString()}</p>
                            {contact.updatedAt !== contact.createdAt && (
                                <p><strong>更新日:</strong> {new Date(contact.updatedAt).toLocaleDateString()}</p>
                            )}
                        </div>

                        <div className="p-admin-contacts__message">
                            <h4>お問い合わせ内容</h4>
                            <div className="p-admin-contacts__message-content">
                                {contact.message}
                            </div>
                        </div>

                        <div className="p-admin-contacts__actions">
                            <div className="p-admin-contacts__status-buttons">
                                {contact.status !== ContactStatus.InProgress && (
                                    <button
                                        className="p-admin-contacts__status-btn is-in-progress"
                                        onClick={() => handleStatusUpdate(contact.id, ContactStatus.InProgress, contact.name)}
                                    >
                                        対応中にする
                                    </button>
                                )}
                                {contact.status !== ContactStatus.Resolved && (
                                    <button
                                        className="p-admin-contacts__status-btn is-resolved"
                                        onClick={() => handleStatusUpdate(contact.id, ContactStatus.Resolved, contact.name)}
                                    >
                                        対応済みにする
                                    </button>
                                )}
                                {contact.status !== ContactStatus.Pending && (
                                    <button
                                        className="p-admin-contacts__status-btn is-pending"
                                        onClick={() => handleStatusUpdate(contact.id, ContactStatus.Pending, contact.name)}
                                    >
                                        未対応に戻す
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredContacts.length === 0 && (
                <div className="p-admin-contacts__no-data">
                    <p>
                        {statusFilter === "pending" ? "未対応のお問い合わせはありません" :
                            statusFilter === "processed" ? "対応済みのお問い合わせはありません" :
                                "お問い合わせはありません"}
                    </p>
                </div>
            )}
        </div>
    );
}