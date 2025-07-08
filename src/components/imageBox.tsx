import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image, { StaticImageData } from "next/image";
import type { MouseEventHandler } from "react";

interface Props {
	className?: string;
	src: string | StaticImport;
	alt?: string;
	onClick?: MouseEventHandler;
	round?: boolean;
	objectFit?: string;
	children?: React.ReactNode;
}

export const ImageBox = (props: Props) => {
	return (
		<div className={`c-image-box ${props.className ?? ""}`}>
			<Image
				fill
				src={props.src}
				alt={props.alt ?? ""}
				className={`c-image-box__image ${props.onClick ? "-button" : ""} ${
					props.round ? "-round" : ""
				}`}
				objectFit={props.objectFit ?? ""}
				onClick={props.onClick}
			/>
			{props.children}
		</div>
	);
};
