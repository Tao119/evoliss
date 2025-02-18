import { useState, useEffect } from "react";
import upArrow from "@/assets/image/arrow-up.svg";
import { ImageBox } from "./imageBox";

interface Props {
  className?: string;
  generate?: boolean;
  name?: string;
  selectedValue?: any;
  data?: object[];
  options?: { value: any; label: string }[];
  label?: string;
  onChange?: Function;
  id?: string;
  includeDefault?: boolean;
}

export const Filter = (props: Props) => {
  const [options, setOptions] = useState<object[]>([]);
  const [selected_value, selectValue] = useState<any>(props.selectedValue);

  useEffect(() => {
    if (props.generate == true && props.data && props.name !== undefined) {
      const optionsSet: Set<string> = new Set();
      const option_param: object[] = [];
      optionsSet.add("All");

      props.data.forEach((item: any) => {
        if (item[props.name!].replace(" ", "") !== "") {
          optionsSet.add(item[props.name!]);
        }
      });
      optionsSet.forEach((option) => {
        option_param.push({
          value: option,
          label: option,
        });
      });
      setOptions(option_param);
    } else {
      setOptions(props.options!);
    }
  }, [props.data, props.options]);

  useEffect(() => {
    selectValue(props.selectedValue!);
  }, [props.selectedValue]);

  const onFilterChange = (event: { target: HTMLSelectElement }) => {
    selectValue(event.target.value);
    props.onChange!(event.target.value);
  };

  return (
    <div className={`c-filter ${props.className || ""}`}>
      <select
        className={`c-filter__filter`}
        onChange={onFilterChange}
        value={selected_value}
        id={props.id}
      >
        {props.includeDefault ? (
          <option value="" disabled selected>
            {props.label}
          </option>
        ) : (
          <></>
        )}
        {options.map(({ value, label }: any, i) => (
          <option value={value} key={i}>
            {label}
          </option>
        ))}
      </select>
      <ImageBox src={upArrow} className="c-filter__image" />
    </div>
  );
};
