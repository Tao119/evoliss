"use client";
import { useContext, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import mailIcon from "@/assets/image/mail.svg";
import lockIcon from "@/assets/image/lock.png";
import hideInput from "@/assets/image/hide_input.svg";
import showInput from "@/assets/image/show_input.svg";
import Image from "next/image";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { signin } from "@/services/auth";
import ConfirmArea from "../confirmArea";
import { requestDB } from "@/services/axios";
import { ImageBox } from "@/components/imageBox";
import { BackButton } from "@/components/backbutton";

const Page = () => {
  const { userData } = useContext(UserDataContext)!;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const params = useSearchParams();
  const callbackPath = params?.get("callback");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const router = useRouter();
  const animation = useContext(AnimationContext)!;

  useEffect(() => {
    if (userData) {
      router.push(callbackPath ?? "/");
    }
  }, [userData, router]);

  useEffect(() => {
    if (step >= 2) {
      handleSignIn();
    }
  }, [step]);

  const handleSignIn = async () => {
    try {
      animation.startAnimation();

      const result = await signin({
        email,
        password,
        callbackUrl: callbackPath!,
      });

      if (result?.error) {
        const error = result.error;
        if (error == "NotAuthorizedException") {
          setErr("認証情報が正しくありません。もう一度お試しください。");
        } else if (error == "UserNotConfirmedException") {
          setStep(1);
        } else {
          setErr("認証中に問題が発生しました。");
        }
      } else {
        router.push(callbackPath ?? "/");
      }
    } catch (error) {
    } finally {
      animation.endAnimation();
    }
  };

  return (
    <div className="p-sign-in">
      <BackButton
        className="p-sign-in__back"
        back={() => {
          if (callbackPath) {
            const callback = callbackPath.startsWith("/")
              ? callbackPath.replace("/", "")
              : callbackPath;

            router.push(
              `/${callback
                .split("/")
                .slice(0, callbackPath.split("/").length - 2)
                .join("/")}`
            );
          }
        }}
      />
      {step == 0 ? (
        <>
          <span className="p-sign-in__title">Login</span>
          <span className="p-sign-in__err">{err}</span>
          <div className={`p-sign-in__item`}>
            <ImageBox className="p-sign-in__input-icon" src={mailIcon} />
            <input
              className={`p-sign-in__input ${emailFocused ? "-focused" : ""}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@co.jp"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </div>
          <div className={`p-sign-in__item`}>
            <ImageBox className="p-sign-in__input-icon" src={lockIcon} />
            <input
              className={`p-sign-in__input ${
                passwordFocused ? "-focused" : ""
              }`}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <ImageBox
              className="p-sign-in__input-password-icon"
              src={showPassword ? hideInput : showInput}
              onClick={() => setShowPassword(!showPassword)}
            />
          </div>
          <button
            className={`p-sign-in__submit ${
              !email || !password ? "-disabled" : ""
            }`}
            disabled={!email || !password}
            onClick={handleSignIn}
          >
            Login
          </button>
          <span
            className="p-sign-in__link"
            onClick={() =>
              router.push(
                `/sign-up${callbackPath ? "?callback=" + callbackPath : ""}`
              )
            }
          >
            Sign Up
          </span>
        </>
      ) : (
        step == 1 && (
          <ConfirmArea
            email={email}
            error={err}
            setError={setErr}
            setStep={setStep}
          />
        )
      )}
    </div>
  );
};

export default Page;
