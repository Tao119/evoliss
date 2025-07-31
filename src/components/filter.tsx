import upArrow from "@/assets/image/arrow-up.svg";
import { useEffect, useState, useRef } from "react";
import { ImageBox } from "./imageBox";
import type { StaticImageData } from "next/image";

interface Props {
	className?: string;
	generate?: boolean;
	name?: string;
	selectedValue?: any;
	data?: any[];
	options?: { value: any; label: string | StaticImageData }[];
	label?: string;
	onChange?: Function;
	id?: string;
	includeDefault?: boolean;
	center?: boolean;
	disabled?: boolean;
}

export const Filter = (props: Props) => {
	const [options, setOptions] = useState<any[]>([]);
	const [selectedValue, setSelectedValue] = useState<any>("");
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	/* options を組み立てる */
	useEffect(() => {
		let opts: { value: any; label: string | StaticImageData }[] = [];

		if (props.generate && props.data && props.name) {
			const s = new Set<string>(["All"]);
			props.data.forEach((v: any) => {
				const val = v[props.name!]?.trim?.() || "";
				if (val) s.add(val);
			});
			opts = [...s].map((o) => ({ value: o, label: o }));
		} else if (props.options) {
			opts = props.options;
		}

		setOptions(opts);
	}, [props.data, props.options, props.generate, props.name]);

	/* 外部から選択値が変わったとき */
	useEffect(() => {
		setSelectedValue(props.selectedValue ?? "");
	}, [props.selectedValue]);

	/* クリックイベントでドロップダウンを閉じる */
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleSelect = (value: any) => {
		setSelectedValue(value);
		props.onChange?.(value);
		setIsOpen(false);
	};

	const getSelectedLabel: any = () => {
		const selected = options.find((opt: any) => opt.value === selectedValue);
		return selected?.label || props.label || "Select...";
	};

	// 画像かテキストかを判定
	const isImage = (label: any): label is StaticImageData => {
		return label && typeof label === 'object' && 'src' in label;
	};

	// シンプルなselectタグバージョン（画像なしの場合）
	const hasImages = options.some((opt: any) => isImage(opt.label));

	if (!hasImages) {
		return (
			<div className={`c-filter ${props.className ?? ""}`}>
				<select
					className={`c-filter__filter ${props.center ? "-center" : ""}`}
					onChange={(e) => {
						const v = e.target.value;
						setSelectedValue(v);
						props.onChange?.(v);
					}}
					value={selectedValue}
					id={props.id}
					disabled={props.disabled}
				>
					{props.includeDefault && (
						<option value="" disabled>
							{props.label ?? "Select..."}
						</option>
					)}

					{options.map(({ value, label }: any) => (
						<option key={value} value={value}>
							{label}
						</option>
					))}
				</select>
			</div>
		);
	}

	// カスタムドロップダウンバージョン（画像ありの場合）
	const selectedLabel = getSelectedLabel();

	return (
		<div className={`c-filter -custom ${props.className ?? ""}`} ref={dropdownRef}>
			<div
				className={`c-filter__selected ${props.center ? "-center" : ""} ${props.disabled ? "-disabled" : ""}`}
				onClick={() => !props.disabled && setIsOpen(!isOpen)}
				id={props.id}
			>
				<div className="c-filter__selected-content">
					{isImage(selectedLabel) ? (
						<ImageBox src={selectedLabel} className="c-filter__selected-image" />
					) : (
						<span className="c-filter__selected-text">{selectedLabel}</span>
					)}
				</div>
			</div>

			{isOpen && !props.disabled && (
				<div className="c-filter__dropdown">
					{props.includeDefault && (
						<div
							className="c-filter__option"
							onClick={() => handleSelect("")}
						>
							<span className="c-filter__option-text">
								{props.label ?? "Select..."}
							</span>
						</div>
					)}

					{options.map(({ value, label }: any) => (
						<div
							key={value}
							className={`c-filter__option ${value === selectedValue ? "-selected" : ""}`}
							onClick={() => handleSelect(value)}
						>
							{isImage(label) ? (
								<ImageBox src={label} objectFit="cover" className="c-filter__option-image" />
							) : (
								<span className="c-filter__option-text">{label}</span>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
};
