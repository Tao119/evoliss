import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// ナビゲーション履歴を管理するカスタムフック
export const useNavigationHistory = () => {
	const pathname = usePathname();
	const previousPathRef = useRef<string | null>(null);

	useEffect(() => {
		// 現在のパスをセッションストレージに保存（履歴として）
		const historyKey = "navigation_history";
		const currentHistory = sessionStorage.getItem(historyKey);
		const historyArray = currentHistory ? JSON.parse(currentHistory) : [];
		
		// 新しいパスを追加（重複しない場合のみ）
		if (historyArray[historyArray.length - 1] !== pathname) {
			historyArray.push(pathname);
			// 履歴は最大20件まで保持
			if (historyArray.length > 20) {
				historyArray.shift();
			}
			sessionStorage.setItem(historyKey, JSON.stringify(historyArray));
		}

		// 前のパスを記録
		previousPathRef.current = historyArray[historyArray.length - 2] || null;
	}, [pathname]);

	// 履歴から指定されたパスを除外した最後のパスを取得
	const getLastPathExcluding = (excludePaths: string[]): string | null => {
		const historyKey = "navigation_history";
		const currentHistory = sessionStorage.getItem(historyKey);
		const historyArray = currentHistory ? JSON.parse(currentHistory) : [];
		
		// 現在のパスより前の履歴を逆順で確認
		for (let i = historyArray.length - 2; i >= 0; i--) {
			const path = historyArray[i];
			const isExcluded = excludePaths.some(excludePath => 
				path.includes(excludePath)
			);
			if (!isExcluded) {
				return path;
			}
		}
		
		return null;
	};

	// ループを検出する
	const detectLoop = (targetPath: string, maxSteps: number = 3): boolean => {
		const historyKey = "navigation_history";
		const currentHistory = sessionStorage.getItem(historyKey);
		const historyArray = currentHistory ? JSON.parse(currentHistory) : [];
		
		// 履歴が短すぎる場合はループではない
		if (historyArray.length < maxSteps * 2) {
			return false;
		}
		
		// 最近の履歴でパターンを探す
		const recentHistory = historyArray.slice(-maxSteps * 2);
		let loopCount = 0;
		
		for (let i = 0; i < recentHistory.length; i++) {
			if (recentHistory[i] === targetPath) {
				loopCount++;
			}
		}
		
		// 同じパスが3回以上出現したらループとみなす
		return loopCount >= 3;
	};

	// 履歴をクリア
	const clearHistory = () => {
		sessionStorage.removeItem("navigation_history");
	};

	return {
		previousPath: previousPathRef.current,
		getLastPathExcluding,
		detectLoop,
		clearHistory
	};
};
