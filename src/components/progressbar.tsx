import { useState, useEffect } from "react";

interface Props {
  className?: string;
  value: number;
  color?: string;
}
export const ProgressBar = (props: Props) => {
  const value = props.value;
  const [color, setColor] = useState(props.color || "");

  useEffect(() => {
    if (!props.color) {
      if (value == 0) {
        setColor("pale-blue");
      } else if (value < 0.4) {
        setColor("red");
      } else if (value < 0.7) {
        setColor("yellow");
      } else if (value < 1.0) {
        setColor("blue");
      } else {
        setColor("green");
      }
    }
  }, [value, props.color]);

  return (
    <progress
      className={`c-progressbar -${color} ${props.className || ""}`}
      value={value}
    />
  );
};
