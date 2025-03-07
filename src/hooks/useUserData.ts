"use client";
import { requestDB } from "@/services/axios";
import { User } from "@/type/models";
import { useSession } from "next-auth/react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export enum UserDataStatus {
    Loading,
    Authorized,
    unAuthorized,
}


export type UserDataContextType = {
    userData: User | undefined;
    fetchUserData: () => void;
    userDataStatus: UserDataStatus
    setUserDataStatus: Dispatch<SetStateAction<UserDataStatus>>
};

export const useUserData = (): UserDataContextType => {
    const [userData, setUserData] = useState<User>();
    const session = useSession();
    const [userDataStatus, setUserDataStatus] = useState(UserDataStatus.Loading)
    useEffect(() => {
        console.log(userDataStatus)
    }, [userDataStatus])

    const fetchUserData = async () => {

        try {
            if (userData) {
                const { data: user } = await requestDB("user", "readUserById", {
                    id: userData.id,
                });
                setUserData(user);
                setUserDataStatus(UserDataStatus.Authorized)
            } else if (session.data?.user) {
                const { data: user } = await requestDB("user", "readUserByEmail", {
                    email: session.data?.user?.email,
                });
                setUserData(user);
                setUserDataStatus(UserDataStatus.Authorized)
            } else {
                setUserDataStatus(UserDataStatus.unAuthorized);
            }
        } catch (e) {
            console.log(e)
        }
    };

    return { userData, fetchUserData, userDataStatus, setUserDataStatus };
};
