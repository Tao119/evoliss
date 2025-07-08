import type React from "react";
import { KeyboardEvent, type MouseEventHandler } from "react";

interface Props {
	className?: string;
	onClick?: MouseEventHandler<HTMLButtonElement>;
	children?: React.ReactNode;
	inactive?: boolean;
	disabled?: boolean;
}

export const Button = (props: Props) => {
	return (
		<button
			className={`c-button ${props.inactive ? "-inactive" : ""} ${
				props.className || ""
			}`}
			onClick={props.inactive ? () => {} : props.onClick}
			disabled={props.disabled}
		>
			{props.children}
		</button>
	);
};
