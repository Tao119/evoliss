import { prisma } from "@/lib/prisma";
import { withTransaction, safeTransaction } from "@/lib/transaction";
import { RefundStatus } from "@/type/models";

export const adminFuncs: { [funcName: string]: Function } = {
    getUsersWithStats,
    getContacts,
    getRefunds,
    registerPayment,
    processRefund,
    updateContactStatus,
    getDashboardStats,
};

// ユーザー一覧と売上統計を取得
async function getUsersWithStats() {
    const users = await prisma.user.findMany({
        include: {
            paymentAccount: true,
            userPayment: {
                orderBy: {
                    createdAt: "desc"
                }
            },
            courses: {
                include: {
                    reservations: {
                        include: {
                            payment: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    // 今月の開始日を取得
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 各ユーザーの売上統計を計算
    const usersWithStats = users.map(user => {
        let totalSales = 0;
        let thisMonthSales = 0;
        let totalPayments = 0;

        // コーチとしての売上を計算
        user.courses.forEach(course => {
            course.reservations.forEach(reservation => {
                if (reservation.payment) {
                    totalSales += reservation.payment.amount;

                    // 今月の売上を計算
                    if (new Date(reservation.payment.createdAt) >= thisMonthStart) {
                        thisMonthSales += reservation.payment.amount;
                    }
                }
            });
        });

        // 入金済み金額を計算
        user.userPayment.forEach(payment => {
            totalPayments += payment.amount;
        });

        const unpaidAmount = totalSales - totalPayments;

        return {
            ...user,
            totalSales,
            thisMonthSales,
            unpaidAmount: Math.max(0, unpaidAmount) // 負の値は0にする
        };
    });

    return usersWithStats;
}

// お問い合わせ一覧を取得
async function getContacts() {
    return await prisma.contact.findMany({
        orderBy: {
            createdAt: "desc"
        }
    });
}

// キャンセル申請一覧を取得
async function getRefunds() {
    return await prisma.refund.findMany({
        include: {
            reservation: {
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    course: {
                        include: {
                            coach: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: {
            id: "desc"
        }
    });
}

// 入金登録
async function registerPayment({ userId, amount }: { userId: number; amount: number }) {
    return await safeTransaction(async (tx) => {
        return tx.userPayment.create({
            data: {
                userId,
                amount
            }
        });
    });
}

// キャンセル申請の承認・棄却
async function processRefund({ refundId, action }: { refundId: number; action: "accept" | "deny" }) {
    return await safeTransaction(async (tx) => {
        const newStatus = action === "accept" ? RefundStatus.Accepted : RefundStatus.Denied;

        const updatedRefund = await tx.refund.update({
            where: { id: refundId },
            data: { status: newStatus }
        });

        // 承認の場合、予約のステータスも更新
        if (action === "accept" && updatedRefund.reservationId) {
            await tx.reservation.update({
                where: { id: updatedRefund.reservationId },
                data: { status: 5 } // Canceled
            });
        }

        return updatedRefund;
    });
}

// お問い合わせステータス更新
async function updateContactStatus({ contactId, status }: { contactId: number; status: number }) {
    return await safeTransaction(async (tx) => {
        return tx.contact.update({
            where: { id: contactId },
            data: { status }
        });
    });
}

// ダッシュボード統計を取得
async function getDashboardStats() {
    // 総ユーザー数
    const totalUsers = await prisma.user.count();

    // 総売上と未振込金額を計算
    const users = await prisma.user.findMany({
        include: {
            userPayment: true,
            courses: {
                include: {
                    reservations: {
                        include: {
                            payment: true
                        }
                    }
                }
            }
        }
    });

    let totalSales = 0;
    let totalPayments = 0;

    users.forEach(user => {
        // コーチとしての売上を計算
        user.courses.forEach(course => {
            course.reservations.forEach(reservation => {
                if (reservation.payment) {
                    totalSales += reservation.payment.amount;
                }
            });
        });

        // 入金済み金額を計算
        user.userPayment.forEach(payment => {
            totalPayments += payment.amount;
        });
    });

    const unpaidAmount = Math.max(0, totalSales - totalPayments);

    // 未対応お問い合わせ数
    const pendingContacts = await prisma.contact.count({
        where: {
            status: 0 // ContactStatus.Pending
        }
    });

    // 未対応キャンセル申請数
    const pendingRefunds = await prisma.refund.count({
        where: {
            status: RefundStatus.Created
        }
    });

    return {
        totalUsers,
        totalSales,
        unpaidAmount,
        pendingContacts,
        pendingRefunds
    };
}