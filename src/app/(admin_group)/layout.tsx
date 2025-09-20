"use client";

import { useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserDataContext } from "../contextProvider";
import { UserDataStatus } from "@/hooks/useUserData";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userData, userDataStatus } = useContext(UserDataContext)!;
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (userDataStatus === UserDataStatus.Authorized && (!userData || !userData.isAdmin)) {
            router.push("/");
        }
        if (userDataStatus === UserDataStatus.unAuthorized) {
            router.push("/");
        }
    }, [userData, userDataStatus, router]);

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/" });
    };

    const isActive = (path: string) => {
        if (!pathname) return false;
        if (path === "/admin" && pathname === "/admin") return true;
        if (path !== "/admin" && pathname.startsWith(path)) return true;
        return false;
    };

    if (userDataStatus === UserDataStatus.Loading) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>管理者権限を確認中...</p>
            </div>
        );
    }

    if (!userData || !userData.isAdmin) {
        return null;
    }

    const menuItems = [
        { path: "/admin", label: "ダッシュボード" },
        { path: "/admin/users", label: "ユーザー管理" },
        { path: "/admin/contacts", label: "お問い合わせ" },
        { path: "/admin/cancels", label: "キャンセル申請" },
    ];

    return (
        <div className="p-admin-layout">
            <nav className="p-admin-nav">
                <div className="p-admin-nav__header">
                    <h1 className="p-admin-nav__title">管理者画面</h1>
                    <div className="p-admin-nav__user-info">
                        <span className="p-admin-nav__user-name">{userData.name || userData.email}</span>
                        <span className="p-admin-nav__badge">管理者</span>
                    </div>
                </div>

                <ul className="p-admin-nav__menu">
                    {menuItems.map((item) => (
                        <li key={item.path} className={`p-admin-nav__menu-item ${isActive(item.path) ? "is-active" : ""}`}>
                            <Link href={item.path} className="p-admin-nav__menu-link">
                                <span className="p-admin-nav__menu-label">{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>


            </nav>
            <main className="p-admin-content">
                {children}
            </main>
        </div>
    );
}