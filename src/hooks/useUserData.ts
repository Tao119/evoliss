"use client";
import { requestDB } from "@/services/axios";
import { User } from "@/type/models";
import { useSession } from "next-auth/react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";


export type UserDataContextType = {
    userData: User | undefined;
    fetchUserData: () => void
};

export const useUserData = (): UserDataContextType => {
    const [userData, setUserData] = useState<User>();
    const session = useSession();

    const fetchUserData = async () => {

        try {
            if (userData) {
                const { data: user } = await requestDB("user", "readUserById", {
                    id: userData.id,
                });
                setUserData(user);
            } else if (session.data?.user) {
                const { data: user } = await requestDB("user", "readUserByEmail", {
                    email: session.data?.user?.email,
                });
                setUserData(user);
            }
        } catch (e) {
            console.log(e)
        }
    };

    return { userData, fetchUserData };
};
