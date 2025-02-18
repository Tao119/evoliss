import { useState } from "react";

interface Props {
  className?: string;
  classNameTab?: string;
  contents: string[];
  onChange: Function;
  data?: any[];
}

export const Switcher = (props: Props) => {
  const [activeItem, setActiveItem] = useState(props.contents[0]);
  return (
    <>
      <ul className={`c-switcher  ${props.className || ""}`}>
        {props.contents.map((item, index) => (
          <li
            key={index}
            className={`c-switcher__item ${
              item == activeItem ? "-active" : ""
            } ${props.classNameTab || ""}`}
            onClick={() => (
              setActiveItem(item), props.onChange(props.data![index])
            )}
          >
            {item}
          </li>
        ))}
      </ul>
    </>
  );
};
