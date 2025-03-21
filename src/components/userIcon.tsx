"use client";

import { ImageBox } from "@/components/imageBox";
import defaultIcon from "@/assets/image/user_icon.svg";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import { CSSProperties, MouseEventHandler } from "react";

const UserIcon = ({
  className,
  src,
  onClick,
}: {
  src?: string | StaticImport | null | undefined;
  className?: string;
  onClick?: MouseEventHandler | undefined;
}) => {
  return (
    <ImageBox
      className={className}
      src={src ?? defaultIcon}
      objectFit="cover"
      round
      onClick={onClick}
    />
  );
};

export default UserIcon;
