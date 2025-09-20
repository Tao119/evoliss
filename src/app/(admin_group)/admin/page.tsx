"use client";

import Link from "next/link";

export default function AdminDashboard() {
    return (
        <div className="p-admin-dashboard">
            <h1 className="p-admin-dashboard__title">管理者メニュー</h1>

            <div className="p-admin-dashboard__menu">
                <Link href="/admin/users" className="p-admin-dashboard__menu-card">
                    <h3 className="p-admin-dashboard__menu-title">ユーザー管理</h3>
                    <p className="p-admin-dashboard__menu-description">ユーザー一覧、売上統計、入金管理</p>
                </Link>

                <Link href="/admin/contacts" className="p-admin-dashboard__menu-card">
                    <h3 className="p-admin-dashboard__menu-title">お問い合わせ管理</h3>
                    <p className="p-admin-dashboard__menu-description">ユーザーからのお問い合わせ対応</p>
                </Link>

                <Link href="/admin/cancels" className="p-admin-dashboard__menu-card">
                    <h3 className="p-admin-dashboard__menu-title">キャンセル申請管理</h3>
                    <p className="p-admin-dashboard__menu-description">キャンセル申請の承認・棄却処理</p>
                </Link>
            </div>
        </div>
    );
}