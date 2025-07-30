import BackImage from "@/assets/image/arrow2_left.svg";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useNavigationHistory } from "@/hooks/useNavigationHistory";

interface Props {
	className?: string;
	back?: Function;
	fallbackUrl?: string; // router.back()ができない場合の遷移先
	restrictedPaths?: string[]; // これらのパスに戻ることを制限
	restrictedFallbackUrl?: string; // 制限されたパスに戻ろうとした場合の遷移先
	useSmartNavigation?: boolean; // 履歴追跡を使った高度なナビゲーション
	preventLoop?: boolean; // ループ防止機能を有効にする
}

export const BackButton = (props: Props) => {
	const router = useRouter();
	const pathname = usePathname();
	const { previousPath, getLastPathExcluding, detectLoop } = useNavigationHistory();

	const handleBack = () => {
		if (props.back) {
			props.back();
			return;
		}

		// ループ検出（デフォルトで有効）
		if (props.preventLoop !== false) {
			// previousPathに戻ることでループが発生するかチェック
			if (previousPath && detectLoop(previousPath)) {
				// ループを検出した場合
				const excludePaths = props.restrictedPaths || [];
				// ループに関与しているパスを除外リストに追加
				excludePaths.push(previousPath);
				const safePath = getLastPathExcluding(excludePaths);
				
				if (safePath) {
					router.push(safePath);
					return;
				} else if (props.fallbackUrl) {
					router.push(props.fallbackUrl);
					return;
				} else if (props.restrictedFallbackUrl) {
					router.push(props.restrictedFallbackUrl);
					return;
				} else {
					router.push('/mypage');
					return;
				}
			}
		}

		// スマートナビゲーションが有効な場合
		if (props.useSmartNavigation && props.restrictedPaths && props.restrictedPaths.length > 0) {
			// 制限されたパス以外の最後のパスを取得
			const safePath = getLastPathExcluding(props.restrictedPaths);
			
			if (safePath) {
				router.push(safePath);
				return;
			} else if (props.restrictedFallbackUrl) {
				// 安全なパスが見つからない場合は指定されたフォールバック先へ
				router.push(props.restrictedFallbackUrl);
				return;
			}
		}

		// 通常のナビゲーション
		// 前のパスが制限されたパスの場合
		if (previousPath && props.restrictedPaths && props.restrictedPaths.length > 0) {
			const isRestricted = props.restrictedPaths.some(restrictedPath => 
				previousPath.includes(restrictedPath)
			);
			
			if (isRestricted && props.restrictedFallbackUrl) {
				router.push(props.restrictedFallbackUrl);
				return;
			}
		}

		// history APIで戻れるかチェック
		if (window.history.length > 1) {
			router.back();
		} else if (props.fallbackUrl) {
			// 戻れない場合はfallbackUrlへ
			router.push(props.fallbackUrl);
		} else {
			// デフォルトはマイページへ
			router.push("/mypage");
		}
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
