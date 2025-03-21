// User型
export interface User {
    id: number;
    name: string | null;
    email: string;
    icon: string | null;
    header: string | null;
    bio: string | null;
    isAdmin: boolean
    createdAt: Date;
    updatedAt: Date;

    sentMessages: Message[];
    receivedMessages: Message[];
    courses: Course[];
    reservations: Reservation[];
    payments: Payment[];
    searchHistories: SearchHistory[];
    userGames: UserGame[];
    messageRooms: MessageRoom[]
    notification: Notification[]
    sentNotification: Notification[]
    purchaseMessages: PurchaseMessage[];
    refunds: Refund[]
    paymentAccount: PaymentAccount[]
    userPayment: UserPayment[]
}
export interface PaymentAccount {
    id: number
    userId: number
    user: User
    bankName: string
    branchName: string
    accountType: number
    accountNumber: string
    accountHolder: string
    createdAt: Date
    updatedAt: Date
}

export interface UserPayment {
    id: number
    userId: number
    user: User
    amount: number
    createdAt: Date
}

export enum AccountType {
    Saving,
    Checking
}

// Course型
export interface Course {
    id: number;
    title: string;
    description: string;
    price: number;
    image: string | null;
    coachId: number;
    createdAt: Date;
    updatedAt: Date;
    gameId: number;
    duration: number;

    coach: User;
    game: Game;
    schedules: Schedule[];
    reservations: Reservation[];
    reviews: Review[];
    messageRooms: MessageRoom[]
    courseAccesses: CourseAccess[]
}

export interface CourseAccess {
    id: number
    courseId: number
    course: Course
    userId: number
    user: User
    createdAt: Date
}

// Schedule型
export interface Schedule {
    id: number;
    courseId: number;
    startTime: Date;
    createdAt: Date;
    updatedAt: Date;

    course: Course;
    reservations: Reservation[];
    payments: Payment[];
    purchaseMessages: PurchaseMessage[];
}

// Reservation型
export interface Reservation {
    id: number;
    customerId: number;
    scheduleId: number;
    courseId: number;
    createdAt: Date;
    updatedAt: Date;

    customer: User;
    schedule: Schedule;
    course: Course;
    refunds: Refund[]
    roomId: number
    room: MessageRoom
}

export enum RefundStatus {
    Created,
    Accepted,
    Denied
}
export interface Refund {
    id: number
    customerId: number
    customer: User
    reservationId: number
    reservation: Reservation
    status: RefundStatus
    text: string
}

export interface MessageRoom {
    id: number;
    roomKey: string;
    courseId: number;
    course: Course;
    customerId: number;
    customer: User;
    messages: Message[];
    purchaseMessages: PurchaseMessage[];
    reservation: Reservation[];
}

export interface Message {
    id: number;
    roomId: number;
    room: MessageRoom;
    senderId: number;
    sender: User;
    content: string;
    isRead: boolean;
    sentAt: Date;
}
export interface PurchaseMessage {
    id: number;
    roomId: number;
    room: MessageRoom;
    senderId: number;
    sender: User;
    scheduleId: number;
    schedule: Schedule;
    isRead: boolean;
    sentAt: Date;
}

// Payment型
export interface Payment {
    id: number;
    customerId: number;
    scheduleId: number;
    amount: number;
    method: string;
    status: paymentStatus
    createdAt: Date;
    updatedAt: Date;

    customer: User;
    schedule: Schedule;
}

export enum paymentStatus {
    Created,
    Paid,
    Confirmed
}

// CourseReview型
export interface Review {
    id: number;
    customerId: number;
    courseId: number;
    rating: number;
    comment: string | null;
    createdAt: Date;

    customer: User;
    course: Course;
}



// SearchHistory型
export interface SearchHistory {
    id: number;
    userId: number;
    query: string;
    searchedAt: Date;
    show: boolean;

    user: User;
}

// Game型
export interface Game {
    id: number;
    name: string;
    image: string | null;
    createdAt: Date;

    courses: Course[];
    userGames: UserGame[];
}


// UserGame型
export interface UserGame {
    id: number;
    userId: number;
    gameId: number;

    user: User;
    game: Game;
}

export interface Notification {
    id: number;
    userId: number;
    user: User;
    senderId: number;
    sender: User;
    content: string;
    createdAt: Date;
    roomId?: number;
    room?: MessageRoom
}