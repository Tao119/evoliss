import { MouseEventHandler } from "react";
import { ImageBox } from "./imageBox";
import { StaticImport } from "next/dist/shared/lib/get-img-props";

interface Props {
  className?: string;
  onClick?: MouseEventHandler;
  src: string | StaticImport;
  children?: React.ReactNode;
  inactive?: boolean;
}

export const IconButton = (props: Props) => {
  return (
    <button
      className={`c-icon-button ${props.inactive ? "-inactive" : ""} ${
        props.className || ""
      }`}
      onClick={props.inactive ? () => {} : props.onClick}
    >
      <ImageBox className="c-icon-button__image" src={props.src} />
      {props.children}
    </button>
  );
};
