import React, { MouseEventHandler, KeyboardEvent } from "react";

interface Props {
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children?: React.ReactNode;
  inactive?: boolean;
}

export const Button = (props: Props) => {
  return (
    <button
      className={`c-button ${props.inactive ? "-inactive" : ""} ${
        props.className || ""
      }`}
      onClick={props.inactive ? () => {} : props.onClick}
    >
      {props.children}
    </button>
  );
};
