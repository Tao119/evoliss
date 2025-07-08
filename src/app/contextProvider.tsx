// app/contextProvider.tsx
"use client";

import {
	type BreakpointContextType,
	useBreakpoint,
} from "@/hooks/useBreakPoint";
import { type SocketContextType, useSocket } from "@/hooks/useSocket";
import { type UserDataContextType, useUserData } from "@/hooks/useUserData";
import { type ReactNode, createContext, useContext, useState } from "react";
import useAnimation, { type AnimationContextType } from "../hooks/useAnimation";

// Header用のContext型定義
interface HeaderContextType {
	isTopPanelVisible: boolean;
	setIsTopPanelVisible: (visible: boolean) => void;
}

// Context作成
export const AnimationContext = createContext<AnimationContextType | undefined>(
	undefined,
);
export const UserDataContext = createContext<UserDataContextType | undefined>(
	undefined,
);
export const SocketContext = createContext<SocketContextType | undefined>(
	undefined,
);
export const BreakPointContext = createContext<
	BreakpointContextType | undefined
>(undefined);
const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

// Header用のカスタムフック
export const useHeader = () => {
	const context = useContext(HeaderContext);
	if (context === undefined) {
		throw new Error("useHeader must be used within a HeaderProvider");
	}
	return context;
};

// メインのContextProvider
export const ContextProvider = ({ children }: { children: ReactNode }) => {
	const animation = useAnimation();
	const [isTopPanelVisible, setIsTopPanelVisible] = useState<boolean>(true);

	return (
		<AnimationContext.Provider value={animation}>
			<UserDataContext.Provider value={useUserData()}>
				<SocketContext.Provider value={useSocket()}>
					<BreakPointContext.Provider value={useBreakpoint()}>
						<HeaderContext.Provider
							value={{
								isTopPanelVisible,
								setIsTopPanelVisible,
							}}
						>
							{children}
							{animation.isVisible && (
								<>
									<div className="l-overlay" />
									<div className="l-animation">{animation.View}</div>
								</>
							)}
						</HeaderContext.Provider>
					</BreakPointContext.Provider>
				</SocketContext.Provider>
			</UserDataContext.Provider>
		</AnimationContext.Provider>
	);
};
