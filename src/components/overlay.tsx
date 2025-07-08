interface Props {
	className?: string;
	onClick?: () => void;
}

export const OverLay = (props: Props) => {
	return (
		<div
			className={`c-overlay ${props.className || ""}`}
			onClick={() => {
				if (props.onClick) {
					props.onClick();
				}
			}}
		/>
	);
};
