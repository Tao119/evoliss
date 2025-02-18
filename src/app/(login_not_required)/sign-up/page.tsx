"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import hideInput from "@/assets/image/hide_input.svg";
import showInput from "@/assets/image/show_input.svg";
import mailIcon from "@/assets/image/mail.png";
import lockIcon from "@/assets/image/lock.png";
import Image from "next/image";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { signIn } from "next-auth/react";
import { createHmac } from "crypto";
import { getSecretHash } from "@/services/hash";
import { signin } from "@/services/auth";
import ConfirmArea from "../confirmArea";
import { requestDB } from "@/services/axios";
import { ImageBox } from "@/components/imageBox";

const Page = () => {
  const { userData } = useContext(UserDataContext)!;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();
  const animation = useContext(AnimationContext)!;
  const [step, setStep] = useState(0);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordConfirmFocused, setPasswordConfirmFocused] = useState(false);

  useEffect(() => {
    if (userData) {
      router.push("/");
    }
  }, [userData, router]);

  useEffect(() => {
    if (step >= 2) {
      handleSignIn();
    }
  }, [step]);

  const handleSignUp = async () => {
    try {
      if (password !== passwordConfirm) {
        setErr("確認用パスワードが一致しません");
        return;
      }

      animation.startAnimation();

      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
      const secretHash = getSecretHash(
        email,
        process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET!
      );

      const client = new CognitoIdentityProviderClient({
        region: process.env.NEXT_PUBLIC_AWS_REGION,
      });

      const params = {
        ClientId: clientId,
        Username: email,
        Password: password,
        Email: email,
        UserAttributes: [{ Name: "email", Value: email }],
        SecretHash: secretHash,
      };

      try {
        const command = new SignUpCommand(params);
        await client.send(command);
        const { success, data: user } = await requestDB("user", "createUser", {
          email,
          name,
        });
        setStep(1);
      } catch (cognitoError: any) {
        if (cognitoError.name === "UsernameExistsException") {
          setErr("既に使用されているメールアドレスです");
        } else if (cognitoError.name === "InvalidPasswordException") {
          setErr("パスワードの要件を満たしていません");
        } else {
          setErr("Cognitoエラーが発生しました: " + cognitoError.message);
        }
      }
    } catch (error) {
      setErr("ユーザー登録中にエラーが発生しました");
    } finally {
      animation.endAnimation();
    }
  };

  const handleSignIn = async () => {
    try {
      animation.startAnimation();

      const result = await signin({ email, password });

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
        router.push("/");
      }
    } catch (error) {
    } finally {
      animation.endAnimation();
    }
  };

  return (
    <div className="p-sign-in">
      {step == 0 ? (
        <>
          <span className="p-sign-in__title">Sign Up</span>
          <span className="p-sign-in__err">{err}</span>
          <div className="p-sign-in__item">
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
          <div className="p-sign-in__item">
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
          <div className="p-sign-in__item">
            <ImageBox className="p-sign-in__input-icon" src={lockIcon} />
            <input
              className={`p-sign-in__input ${
                passwordConfirmFocused ? "-focused" : ""
              }`}
              type={showPasswordConfirm ? "text" : "password"}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="password(confirm)"
              onFocus={() => setPasswordConfirmFocused(true)}
              onBlur={() => setPasswordConfirmFocused(false)}
            />
            <ImageBox
              className="p-sign-in__input-password-icon"
              src={showPasswordConfirm ? hideInput : showInput}
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            />
          </div>
          <button
            className={`p-sign-in__submit ${
              !email || !password || !passwordConfirm ? "-disabled" : ""
            }`}
            disabled={!email || !password || !passwordConfirm}
            onClick={handleSignUp}
          >
            Sign Up
          </button>
          <span
            className="p-sign-in__link"
            onClick={() => router.push("/sign-in")}
          >
            Login
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
