import React from "react";

export const RUTEBAROKAH_LOGO_URL = "https://imgur.com/ZJANadQ.png";

export default function BrandLogo({ className = "h-12 w-12" }) {
  return (
    <img
      src={RUTEBAROKAH_LOGO_URL}
      alt="Logo RuteBarokah"
      className={`${className} rounded-full object-cover shadow-soft`}
    />
  );
}
