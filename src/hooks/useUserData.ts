"use client";
import { requestDB } from "@/services/axios";
import type { User } from "@/type/models";
import { useSession } from "next-auth/react";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

export enum UserDataStatus {
	Loading = 0,
	Authorized = 1,
	unAuthorized = 2,
}

export type UserDataContextType = {
	userData: User | undefined;
	fetchUserData: () => void;
	userDataStatus: UserDataStatus;
	setUserDataStatus: Dispatch<SetStateAction<UserDataStatus>>;
};

export const useUserData = (): UserDataContextType => {
	const [userData, setUserData] = useState<User>();
	const session = useSession();
	const [userDataStatus, setUserDataStatus] = useState(UserDataStatus.Loading);

	const fetchUserData = async () => {
		try {
			if (userData) {
				const { data: user } = await requestDB("user", "readUserById", {
					id: userData.id,
				});
				setUserData(user);
				setUserDataStatus(UserDataStatus.Authorized);
			} else if (session.data !== undefined) {
				if (!session.data?.user?.email) {
					setUserDataStatus(UserDataStatus.unAuthorized);
					return;
				}
				const { data: user } = await requestDB("user", "readUserByEmail", {
					email: session.data?.user?.email,
				});
				if (user) {
					setUserData(user);
					setUserDataStatus(UserDataStatus.Authorized);
				} else {
					setUserDataStatus(UserDataStatus.unAuthorized);
				}
			}
		} catch (e) {
			console.log(e);
		}
	};

	return { userData, fetchUserData, userDataStatus, setUserDataStatus };
};
