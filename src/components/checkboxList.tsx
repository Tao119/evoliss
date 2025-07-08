import React, { useState } from "react";

export interface CheckboxListData {
	label: string;
	checked: boolean;
}

interface Props {
	className?: string;
	dataList: CheckboxListData[];
	handleUpdate: (index: number) => void;
	disabledList?: number[];
}

export const CheckboxList = (props: Props) => {
	return (
		<div className={`c-checkbox-list ${props.className || ""}`}>
			<ul className="c-checkbox-list__items">
				{props.dataList.map((data, index) => (
					<li className="c-checkbox-list__item" key={index}>
						<label className="c-checkbox-list__label">
							<input
								type="checkbox"
								className="c-checkbox-list__checkbox"
								checked={data.checked}
								disabled={
									props.disabledList
										? props.disabledList.includes(index)
										: false
								}
								onChange={() => props.handleUpdate(index)}
							/>
							{data.label}
						</label>
					</li>
				))}
			</ul>
		</div>
	);
};
