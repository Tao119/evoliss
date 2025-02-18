"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button } from "@/components/button";
import { InputBox } from "@/components/inputBox";
import { BackButton } from "@/components/backbutton";
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { getSecretHash } from "@/services/hash";

interface Props {
  email: string;
  setStep: Dispatch<SetStateAction<number>>;
  error: string;
  setError: Dispatch<SetStateAction<string>>;
}

const ConfirmArea = ({ email, setStep, error, setError }: Props) => {
  const [code, setCode] = useState("");

  useEffect(() => {
    setError("");
  }, []);

  const handleConfirm = async () => {
    if (code === "") {
      setError("確認コードを入力してください");
      return;
    }

    const client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION,
    });

    try {
      const secretHash = getSecretHash(
        email,
        process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET!
      );
      const params = {
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        Username: email,
        ConfirmationCode: code,
        SecretHash: secretHash,
      };
      const command = new ConfirmSignUpCommand(params);
      await client.send(command);

      setError("");
      setStep((prev) => prev + 1);
    } catch (error: any) {
      console.error(error);
      setError("確認コードの検証に失敗しました: " + error.message);
    }
  };

  const handleResendCode = async () => {
    const client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION,
    });

    try {
      const secretHash = getSecretHash(
        email,
        process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET!
      );
      const params = {
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        Username: email,
        SecretHash: secretHash,
      };
      const command = new ResendConfirmationCodeCommand(params);
      await client.send(command);

      setError("確認コードを再送しました");
    } catch (error: any) {
      console.error(error);
      setError("確認コードの再送に失敗しました: " + error.message);
    }
  };

  return (
    <>
      <BackButton
        className="p-sign-in__back"
        back={() => {
          setError("");
          setStep((prev) => prev - 1);
        }}
      />
      <div className="p-sign-in__title u-mb36">確認コード送信</div>
      <div className="p-sign-in__error">{error}</div>
      <div className="p-sign-in__input-wrapper">
        <InputBox
          className="p-sign-in__input u-mb36"
          placeholder="Confirmation Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      <Button className="p-sign-in__submit" onClick={handleConfirm}>
        確認コードを送信する
      </Button>
      <div className="p-sign-in__forgot" onClick={handleResendCode}>
        確認コードを再送する
      </div>
    </>
  );
};

export default ConfirmArea;
