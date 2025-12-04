"use client";

import CookieConsentBanner from "react-cookie-consent";
import Link from "next/link";

export function CookieConsent() {
  return (
    <CookieConsentBanner
      location="bottom"
      buttonText="Accept All"
      declineButtonText="Reject Non-Essential"
      enableDeclineButton
      cookieName="spotify-time-machine-cookie-consent"
      style={{
        background: "#1a1a1a",
        padding: "20px",
        alignItems: "center",
      }}
      buttonStyle={{
        background: "#1DB954",
        color: "#fff",
        fontSize: "14px",
        padding: "10px 20px",
        borderRadius: "500px",
        fontWeight: "600",
        border: "none",
        cursor: "pointer",
      }}
      declineButtonStyle={{
        background: "transparent",
        color: "#fff",
        fontSize: "14px",
        padding: "10px 20px",
        borderRadius: "500px",
        fontWeight: "600",
        border: "1px solid #fff",
        cursor: "pointer",
      }}
      expires={365}
      onAccept={() => {
        // Enable analytics cookies
        if (typeof window !== "undefined") {
          (window as Window & { cookieConsentAccepted?: boolean }).cookieConsentAccepted = true;
        }
      }}
      onDecline={() => {
        // Disable analytics cookies
        if (typeof window !== "undefined") {
          (window as Window & { cookieConsentAccepted?: boolean }).cookieConsentAccepted = false;
        }
      }}
    >
      <span style={{ fontSize: "14px", lineHeight: "1.6" }}>
        We use cookies to provide essential functionality and improve your experience.
        By clicking &quot;Accept All&quot;, you consent to our use of cookies for analytics.
        {" "}
        <Link
          href="/PRIVACY_POLICY.md"
          style={{
            color: "#1DB954",
            textDecoration: "underline"
          }}
          target="_blank"
        >
          Learn more in our Privacy Policy
        </Link>
        .
      </span>
    </CookieConsentBanner>
  );
}
