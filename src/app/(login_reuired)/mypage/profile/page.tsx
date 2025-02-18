"use client";

import { useContext, useEffect, useState } from "react";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { Button } from "@/components/button";
import { InputBox } from "@/components/inputBox";
import { requestDB } from "@/services/axios";
import { MultilineInput } from "@/components/multilineInput";
import { UserGame } from "@/type/models";
import { useRouter } from "next/navigation";
import { ImageBox } from "@/components/imageBox";
import { BackButton } from "@/components/backbutton";

const Page = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const router = useRouter();
  const animation = useContext(AnimationContext)!;

  const [bio, setBio] = useState(userData?.bio || "");
  const [tags, setTags] = useState<string[]>(
    userData?.userGames?.map((game) => game.game.name) || []
  );
  const [inputValue, setInputValue] = useState("");

  const onReady = userData;

  useEffect(() => {
    animation.startAnimation();
  }, []);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  if (!onReady) {
    return <>Loading...</>;
  }

  const handleAddTag = (value: string) => {
    if (value.trim() && !tags.includes(value.trim())) {
      setTags([...tags, value.trim()]);
      setInputValue("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    try {
      animation.startAnimation();
      await requestDB("user", "updateUser", { id: userData.id, bio, tags });

      fetchUserData();

      animation.endAnimation();

      router.push("/mypage");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("プロフィールの更新に失敗しました。");
    }
    animation.endAnimation();
  };

  return (
    <div className="p-profile-edit">
      <BackButton
        className="p-profile-edit__back"
        back={() => router.push("/mypage")}
      />
      <div className="p-profile-edit__title">プロフィール編集</div>
      <div className="p-profile-edit__section">
        <div className="p-profile-edit__subtitle">・自己紹介</div>
        <MultilineInput
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="p-profile-edit__bio-input"
          minHeight={160}
          maxHeight={160}
        />
      </div>
      <div className="p-profile-edit__section">
        <div className="p-profile-edit__subtitle">・ゲームタグ</div>
        <div className="p-profile-edit__tag-container">
          <div className="p-profile-edit__tags">
            {tags.map((tag, idx) => (
              <div key={idx} className="p-profile-edit__tag">
                {tag}
                <button
                  className="p-profile-edit__tag-remove"
                  onClick={() => handleRemoveTag(tag)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="p-profile-edit__tag-input-area">
            <InputBox
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e, value) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === "Enter") handleAddTag(value);
              }}
              placeholder="ゲームを入力"
              className="p-profile-edit__tag-input"
            />

            <Button
              onClick={() => handleAddTag(inputValue)}
              className="p-profile-edit__tag-add"
            >
              追加
            </Button>
          </div>
        </div>
      </div>
      <Button onClick={handleSave} className="p-profile-edit__save-button">
        保存
      </Button>
    </div>
  );
};

export default Page;
