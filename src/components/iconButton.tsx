import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import type { MouseEventHandler } from "react";
import { ImageBox } from "./imageBox";

interface Props {
	className?: string;
	onClick?: MouseEventHandler;
	src: string | StaticImport;
	children?: React.ReactNode;
	inactive?: boolean; disabled?: boolean;
}

export const IconButton = (props: Props) => {
	return (
		<button
			className={`c-icon-button ${props.inactive ? "-inactive" : ""} ${props.className || ""
				}`}
			onClick={props.inactive ? () => { } : props.onClick}
			disabled={props.disabled}
		>
			<ImageBox className="c-icon-button__image" src={props.src} />
			{props.children}
		</button>
	);
};
