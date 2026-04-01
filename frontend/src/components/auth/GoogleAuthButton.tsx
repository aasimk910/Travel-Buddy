// src/components/GoogleAuthButton.tsx
// Renders the Google One Tap / Sign-In button using the Google Identity Services SDK.
// #region Imports
import React, { useEffect, useRef } from "react";
import { GOOGLE_CLIENT_ID } from "../../config/env";

// #endregion Imports
type RenderOptions = {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin" | "signup" | "continue";
  type?: "standard" | "icon";
  width?: string | number;
};

type GoogleAuthButtonProps = {
  onCredential: (credential: string) => void;
  clientId?: string;
  renderOptions?: RenderOptions;
  className?: string;
};

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onCredential,
  clientId = GOOGLE_CLIENT_ID,
  renderOptions,
  className,
}) => {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const onCredentialRef = useRef(onCredential);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) return;

    // Handles init logic.
    const init = () => {
      const w = window as any;
      if (!w.google || !buttonRef.current) return;

      // React 18 StrictMode runs effects twice in dev.
      // Guard initialize() to avoid GSI warning + unexpected behavior.
      if (!initializedRef.current) {
        w.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            const cred = response?.credential;
            if (cred) onCredentialRef.current(cred);
          },
        });
        initializedRef.current = true;
      }

      w.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        text: "continue_with",
        ...(renderOptions || {}),
      });
    };

    const w = window as any;
    if (!w.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = init;
      document.body.appendChild(script);
    } else {
      init();
    }
  }, [clientId, onCredential, renderOptions]);

  return <div ref={buttonRef} className={className} />;
};

// #region Exports
export default GoogleAuthButton;
// #endregion Exports
