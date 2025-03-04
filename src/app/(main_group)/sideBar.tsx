"use client";

import React, { Dispatch, SetStateAction, useContext, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ImageBox } from "@/components/imageBox";
import profileIcon from "@/assets/image/logo.png";
import notificationIcon from "@/assets/image/notification.svg";
import messageIcon from "@/assets/image/mail.svg";
import defaultIcon from "@/assets/image/user_icon.svg";
import { UserDataContext } from "../contextProvider";
import loginIcon from "@/assets/image/login.svg";

interface Prop {
  newMessage: boolean;
  setShowMessagePopup: Dispatch<SetStateAction<boolean>>;
  setShowNotificationPopup: Dispatch<SetStateAction<boolean>>;
  showMessagePopup: boolean;
  showNotificationPopup: boolean;
}

const Sidebar = ({
  newMessage,
  setShowMessagePopup,
  setShowNotificationPopup,
  showMessagePopup,
  showNotificationPopup,
}: Prop) => {
  const { userData } = useContext(UserDataContext)!;
  const pathname = usePathname()!;

  const mainRoutes = [
    { path: "/about", text: "EVOLISSとは" },
    { path: "/courses", text: "講座を探す" },
    { path: "/create", text: "コーチをしてみる" },
  ];
  const iconRoutes = [
    {
      path: "/notification",
      icon: notificationIcon,
      alt: "notification Icon",
      text: "通知",
    },
    {
      path: "/message",
      icon: messageIcon,
      alt: "Message Icon",
      text: "メッセージ",
    },
    {
      path: "/mypage",
      icon: userData?.icon || defaultIcon,
      alt: "user Icon",
      text: "マイページ",
    },
  ];

  return (
    <>
      <div className="p-side-bar">
        <div className="p-side-bar__icon">
          <ImageBox
            src={profileIcon}
            alt="Profile"
            className="p-side-bar__logo-icon"
            round
          />
          <div className="p-side-bar__logo-text">EVOLISS</div>
        </div>

        <ul className="p-side-bar__container -upper">
          {mainRoutes.map(({ path, text }) => (
            <Link
              href={`${path}`}
              key={path}
              className={`p-side-bar__list ${
                pathname.replace("/", "").split("/")[0] ==
                `${path.replace("/", "")}`
                  ? "-active"
                  : ""
              }`}
            >
              {text && (
                <div
                  className={`p-side-bar__page-text ${
                    pathname.replace("/", "").split("/")[0] ==
                      `${path.replace("/", "")}` || showMessagePopup
                      ? "-active"
                      : ""
                  }`}
                >
                  {text}
                </div>
              )}
            </Link>
          ))}
        </ul>
        <ul className="p-side-bar__container -lower">
          {userData ? (
            iconRoutes.map(({ path, icon, alt, text }) => {
              return path == "/message" ? (
                <div
                  key={path}
                  className={`p-side-bar__list ${newMessage ? "-new" : ""} ${
                    pathname.replace("/", "").split("/")[0] ==
                    `${path.replace("/", "")}`
                      ? "-active"
                      : ""
                  }`}
                  onClick={() => setShowMessagePopup(true)}
                >
                  <ImageBox
                    className="p-side-bar__page-icon"
                    src={icon}
                    objectFit="cover"
                    round
                  />
                  {text && (
                    <div
                      className={`p-side-bar__page-text ${
                        pathname.replace("/", "").split("/")[0] ==
                        `${path.replace("/", "")}`
                          ? "-active"
                          : ""
                      }`}
                    >
                      {text}
                    </div>
                  )}
                </div>
              ) : path == "/notification" ? (
                <div
                  key={path}
                  className={`p-side-bar__list ${
                    pathname.replace("/", "").split("/")[0] ==
                      `${path.replace("/", "")}` || showMessagePopup
                      ? "-active"
                      : ""
                  }`}
                  onClick={() => setShowNotificationPopup(true)}
                >
                  <ImageBox
                    className="p-side-bar__page-icon"
                    src={icon}
                    objectFit="cover"
                    round
                  />
                  {text && (
                    <div
                      className={`p-side-bar__page-text ${
                        pathname.replace("/", "").split("/")[0] ==
                          `${path.replace("/", "")}` || showNotificationPopup
                          ? "-active"
                          : ""
                      }`}
                    >
                      {text}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={`${path}`}
                  key={path}
                  className={`p-side-bar__list ${
                    pathname.replace("/", "").split("/")[0] ==
                    `${path.replace("/", "")}`
                      ? "-active"
                      : ""
                  }`}
                >
                  <ImageBox
                    className="p-side-bar__page-icon"
                    src={icon}
                    objectFit="cover"
                    round
                  />
                  {text && (
                    <div
                      className={`p-side-bar__page-text ${
                        pathname.replace("/", "").split("/")[0] ==
                        `${path.replace("/", "")}`
                          ? "-active"
                          : ""
                      }`}
                    >
                      {text}
                    </div>
                  )}
                </Link>
              );
            })
          ) : (
            <Link
              href={`/sign-in${pathname ? "?callback=" + pathname : ""}`}
              className="p-side-bar__list"
            >
              <ImageBox
                className="p-side-bar__page-icon"
                src={loginIcon}
                objectFit="cover"
                round
              />
              <div className={"p-side-bar__page-text"}>サインイン</div>
            </Link>
          )}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
