import { ImageBox } from "@/components/imageBox";
import { User } from "@/type/models";
import defaultIcon from "@/assets/image/user_icon.svg";
import moreIcon from "@/assets/image/right-arrow.svg";
import React from "react";

type MessageBoxProps = {
    user: User;
    latestMessage?: string;
    unread?: boolean;
};

const MessageBox: React.FC<MessageBoxProps> = ({ user, latestMessage, unread = false }) => {
    return (
        <div className="p-message-box">
            <div className="p-message-box__header">
                <ImageBox
                    className={`p-message-box__icon ${unread ? '-unread' : ''}`}
                    src={user.icon || defaultIcon}
                    round
                    objectFit="cover"
                />
                <div className="p-message-box__name" >{user.name}</div>
            </div>
            <div className="p-message-box__content">
                <div className="p-message-box__message">{latestMessage || "最初のメッセージを送信しましょう"}</div>
                <ImageBox
                    className="p-message-box__more"
                    src={moreIcon}
                />
            </div>
        </div>
    );
};

export default MessageBox;