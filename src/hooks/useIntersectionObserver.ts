// hooks/useIntersectionObserver.ts
import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions {
	threshold?: number;
	rootMargin?: string;
	root?: Element | null;
	onIntersect?: () => void;
}

export const useIntersectionObserver = (
	options: UseIntersectionObserverOptions = {},
) => {
	const [isIntersecting, setIsIntersecting] = useState<boolean>(true);
	const elementRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = elementRef.current;
		if (!element) {
			const retryInterval = setInterval(() => {
				if (elementRef.current) {
					clearInterval(retryInterval);
					setIsIntersecting((prev) => !prev);
					setTimeout(() => setIsIntersecting((prev) => !prev), 10);
				}
			}, 100);

			setTimeout(() => clearInterval(retryInterval), 5000);

			return () => clearInterval(retryInterval);
		}

		const checkVisibility = () => {
			const rect = element.getBoundingClientRect();

			const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
			return isVisible;
		};

		const initialVisible = checkVisibility();
		setIsIntersecting(initialVisible);

		const observer = new IntersectionObserver(
			([entry]) => {
				setIsIntersecting(entry.isIntersecting);
				if (entry.isIntersecting && options.onIntersect) {
					options.onIntersect();
				}
			},
			{
				threshold: options.threshold ?? 0.1,
				rootMargin: options.rootMargin ?? "0px",
				root: options.root ?? null,
			},
		);

		observer.observe(element);

		const handleScroll = () => {
			const visible = checkVisibility();
			setIsIntersecting(visible);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });

		const timeouts = [100, 300, 500].map((delay, index) => {
			return setTimeout(() => {
				const visible = checkVisibility();
				setIsIntersecting(visible);
			}, delay);
		});

		return () => {
			observer.disconnect();
			window.removeEventListener("scroll", handleScroll);
			timeouts.forEach((timeout) => clearTimeout(timeout));
		};
	});

	return { elementRef, isIntersecting };
};
