// User型
export interface User {
	id: number;
	name: string | null;
	email: string;
	icon: string | null;
	bio: string | null;
	isAdmin: boolean;
	createdAt: Date;
	updatedAt: Date;
	gameId?: number;
	isInitialized: boolean;
	youtube: string | null;
	x: string | null;
	note: string | null;

	sentMessages: Message[];
	courses: Course[];
	reservations: Reservation[];
	payments: Payment[];
	game?: Game;
	searchHistories: SearchHistory[];
	coachMessageRooms: MessageRoom[];
	customerMessageRooms: MessageRoom[];
	paymentAccount?: PaymentAccount;
	userPayment: UserPayment[];
	reviews: Review[];
	timeSlots: TimeSlot[];
	accesses: CourseAccess[];
}
export interface PaymentAccount {
	id: number;
	userId: number;
	user: User;
	bankName: string;
	branchName: string;
	accountType: number;
	accountNumber: string;
	accountHolder: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserPayment {
	id: number;
	userId: number;
	user: User;
	amount: number;
	createdAt: Date;
}

export enum AccountType {
	Saving = 0,
	Checking = 1,
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
	gameId: number | null;
	duration: number;
	isPublic: boolean;
	tagCourses: TagCourse[];

	coach: User;
	game?: Game;
	reservations: Reservation[];
	reviews: Review[];
	accesses: CourseAccess[];
}

export interface CourseAccess {
	id: number;
	courseId: number;
	course: Course;
	userId: number | null;
	user?: User;
	createdAt: Date;
}

// Schedule型
export interface TimeSlot {
	id: number;
	coachId: number;
	dateTime: string;
	createdAt: Date;
	updatedAt: Date;
	reservationId: number | null;

	coach: User;
	reservation?: Reservation;
}

// Reservation型
export interface Reservation {
	id: number;
	customerId: number;
	courseId: number;
	createdAt: Date;
	updatedAt: Date;
	status: reservationStatus;
	courseTime: string | null; // YYYY/MM/dd HH:mm~HH:mm形式

	customer: User;
	timeSlots: TimeSlot[];
	course: Course;
	refunds: Refund[];
	payment?: Payment;
	review?: Review;
	roomId: number | null;
	room?: MessageRoom;
}

export enum RefundStatus {
	Created = 0,
	Accepted = 1,
	Denied = 2,
}
export interface Refund {
	id: number;
	reservationId: number | null;
	reservation?: Reservation;
	status: number;
	text: string;
	createdAt: Date;
}

export interface MessageRoom {
	id: number;
	roomKey: string;
	coachId: number | null;
	coach?: User;
	customerId: number;
	customer: User;
	messages: Message[];
	reservations: Reservation[];
}

export interface Message {
	id: number;
	roomId: number;
	room: MessageRoom;
	senderId: number | null;
	sender?: User;
	content: string;
	isRead: boolean;
	sentAt: Date;
}

// Payment型
export interface Payment {
	id: number;
	customerId: number;
	reservationId: number;
	amount: number;
	method: string;
	createdAt: Date;
	updatedAt: Date;

	customer: User;
	reservation: Reservation;
}

export enum reservationStatus {
	Created = 0,
	Paid = 1,
	Confirmed = 2,
	Done = 3,
	Reviewed = 4,
	Canceled = 5,
	Expired = 6,
	CanceledByCoach = 7,
	CancelRequestedByCoach = 8,
}

// Review型
export interface Review {
	id: number;
	customerId: number;
	courseId: number;
	rating: number;
	comment: string | null;
	createdAt: Date;
	reservationId: number;

	customer: User;
	course: Course;
	reservation: Reservation;
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
	users: User[];
}

export interface Tag {
	id: number;
	name: string;
	createdAt: Date;

	tagCourses: TagCourse[];
}

export interface TagCourse {
	id: number;
	courseId: number;
	tagId: number;

	course: Course;
	tag: Tag;
}

// Contact型
export interface Contact {
	id: number;
	name: string;
	email: string;
	message: string;
	status: ContactStatus;
	createdAt: Date;
	updatedAt: Date;
}

export enum ContactStatus {
	Pending = 0,    // 未対応
	InProgress = 1, // 対応中
	Resolved = 2,   // 対応済み
}
