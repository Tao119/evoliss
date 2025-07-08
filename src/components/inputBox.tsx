import {
	type ChangeEvent,
	type ChangeEventHandler,
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useState,
} from "react";

interface Props {
	className?: string;
	placeholder?: string;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	onKeyDown?: (event: KeyboardEvent<HTMLInputElement>, value: any) => void;
	value?: string | number;
	type?: string;
	defaultValue?: string | number;
	disabled?: boolean;
	children?: ReactNode;
}

export const InputBox = (props: Props) => {
	const [inputValue, setValue] = useState(props.value);
	const onInput = (e: ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value);
		props.onChange ? props.onChange(e) : null;
	};

	useEffect(() => {
		setValue(props.value || "");
	}, [props.value]);

	return (
		<>
			<div className={`c-input-box__container ${props.className || ""}`}>
				<input
					onKeyDown={(e) =>
						props.onKeyDown ? props.onKeyDown(e, inputValue) : null
					}
					type={props.type || "string"}
					className={`c-input-box`}
					onChange={onInput}
					value={inputValue}
					placeholder={props.placeholder}
					defaultValue={props.defaultValue ?? undefined}
					disabled={props.disabled || false}
				/>
				{props.children}
			</div>
		</>
	);
};
