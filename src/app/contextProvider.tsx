"use client";

import useAnimation, { AnimationContextType } from "../hooks/useAnimation";
import { createContext, ReactNode, useEffect, useState } from "react";
import { UserDataContextType, useUserData } from "@/hooks/useUserData";
import { SocketContextType, useSocket } from "@/hooks/useSocket";

export const AnimationContext = createContext<AnimationContextType | undefined>(
  undefined
);
export const UserDataContext = createContext<UserDataContextType | undefined>(
  undefined
);
export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

export const ContextProvider = ({ children }: { children: ReactNode }) => {
  const animation = useAnimation();

  return (
    <AnimationContext.Provider value={animation}>
      <UserDataContext.Provider value={useUserData()}>
        <SocketContext.Provider value={useSocket()}>
          {children}
          {animation.isVisible && (
            <>
              <div className="l-overlay" />
              <div className="l-animation">{animation.View}</div>
            </>
          )}
        </SocketContext.Provider>
      </UserDataContext.Provider>
    </AnimationContext.Provider>
  );
};
