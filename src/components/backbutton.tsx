import BackImage from "@/assets/image/arrow2_left.svg";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

interface Props {
	className?: string;
	back?: Function;
	fallbackUrl?: string; // router.back()ができない場合の遷移先
	restrictedPaths?: string[]; // これらのパスに戻ることを制限
	restrictedFallbackUrl?: string; // 制限されたパスに戻ろうとした場合の遷移先
	preventLoop?: boolean; // ループ防止機能を有効にする
}

export const BackButton = (props: Props) => {
	const router = useRouter();
	const pathname = usePathname()!;
	const [canGoBack, setCanGoBack] = useState(true);
	const lastNavigatedFrom = useRef<string | null>(null);

	useEffect(() => {
		// window.historyのlengthをチェックして戻れるか判定
		setCanGoBack(window.history.length > 1);

		// ループ防止のための履歴管理
		if (props.preventLoop !== false) {
			// このページに来る前のページを記録
			const navigationSource = sessionStorage.getItem('navigation_source');
			if (navigationSource && navigationSource !== pathname) {
				lastNavigatedFrom.current = navigationSource;
			}
			// 現在のページを記録
			sessionStorage.setItem('navigation_source', pathname);
		}
	}, [pathname, props.preventLoop]);

	const handleBack = () => {
		if (props.back) {
			props.back();
			return;
		}

		// ループ防止チェック
		if (props.preventLoop !== false && lastNavigatedFrom.current) {
			// 直前のページが現在のページと同じ場合（ループの可能性）
			const currentNavSource = sessionStorage.getItem('last_back_destination');
			if (currentNavSource === pathname) {
				// ループを検出した場合はfallbackUrlへ
				if (props.fallbackUrl) {
					router.push(props.fallbackUrl);
				} else if (props.restrictedFallbackUrl) {
					router.push(props.restrictedFallbackUrl);
				} else {
					router.push('/mypage');
				}
				return;
			}
		}

		// 戻れない場合はfallbackUrlへ
		if (!canGoBack && props.fallbackUrl) {
			router.push(props.fallbackUrl);
			return;
		}

		// 制限されたパスのチェック
		if (props.restrictedPaths && props.restrictedPaths.length > 0) {
			// 前のページのURLを取得する方法は限定的だが、
			// document.referrerを使って判定を試みる
			const referrer = document.referrer;
			if (referrer) {
				try {
					const referrerUrl = new URL(referrer);
					const referrerPath = referrerUrl.pathname;

					// 制限されたパスに該当するかチェック
					const isRestricted = props.restrictedPaths.some(restrictedPath =>
						referrerPath.includes(restrictedPath)
					);

					if (isRestricted && props.restrictedFallbackUrl) {
						router.push(props.restrictedFallbackUrl);
						return;
					}
				} catch (e) {
					// URLパースエラーの場合は通常のback処理
				}
			}
		}

		// backで戻る前に、現在のページを記録（ループ防止用）
		if (props.preventLoop !== false) {
			sessionStorage.setItem('last_back_destination', pathname);
		}

		// 通常のback処理
		router.back();
	};

	return (
		<Image
			src={BackImage}
			alt=""
			className={`c-back-button ${props.className || ""}`}
			onClick={handleBack}
		/>
	);
};
