import { useEffect, useState } from "react";

interface Props {
	className?: string;
	classNameTab?: string;
	contents: { label: string; value: any }[];
	onChange: (value: any) => void;
	selectedValue?: string;
	type2?: boolean;
}

export const Switcher = (props: Props) => {
	const [activeItem, setActiveItem] = useState(props.contents[0].value);
	useEffect(() => {
		if (props.selectedValue && props.selectedValue != activeItem) {
			setActiveItem(props.selectedValue);
		}
	}, [props.selectedValue, activeItem]);

	return (
		<ul
			className={`c-switcher ${props.className || ""} ${
				props.type2 ? "-type2" : ""
			}`}
		>
			{props.contents.map((item, index) => (
				<li
					key={index}
					className={`c-switcher__item ${
						item.value === activeItem ? "-active" : ""
					} ${props.classNameTab || ""} ${props.type2 ? "-type2" : ""}`}
					onClick={() => {
						setActiveItem(item.value);
						props.onChange(item.value);
					}}
				>
					{item.label}
				</li>
			))}
		</ul>
	);
};
