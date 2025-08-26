import type React from "react";
import { type ChangeEventHandler, type KeyboardEvent, useState } from "react";

interface Props {
	className?: string;
	placeholder?: string;
	onChange?: ChangeEventHandler<HTMLTextAreaElement>;
	value?: string | number;
	defaultValue?: string | number;
	disabled?: boolean;
	children?: React.ReactNode;
	onEnter?: Function;
	maxHeight?: number;
	minHeight?: number;
}

export const MultilineInput: React.FC<Props> = ({
	className = "",
	placeholder = "",
	onChange,
	value,
	defaultValue,
	disabled = false,
	children,
	onEnter,
	maxHeight = 140,
	minHeight = 50,
}) => {
	const [height, setHeight] = useState<number>(minHeight);

	const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const lineHeight = 30;
		const currentLines = event.target.value.split("\n").length;
		const newHeight = Math.max(
			Math.min(50 + lineHeight * (currentLines - 1), maxHeight),
			minHeight,
		);

		setHeight(newHeight);
		onChange && onChange(event);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		const nativeEvent = event.nativeEvent as any;
		if (
			event.key === "Enter" &&
			!event.shiftKey &&
			!nativeEvent.isComposing &&
			onEnter
		) {
			event.preventDefault();
			onEnter();
		}
	};

	return (
		<div className={`c-multiline-input ${className}`}>
			<textarea
				className="c-multiline-input__textarea"
				placeholder={placeholder}
				onChange={handleInput}
				onKeyDown={handleKeyDown}
				value={value}
				defaultValue={defaultValue}
				disabled={disabled}
				style={{
					height: `${height}px`,
				}}
			/>
			{children}
		</div>
	);
};
