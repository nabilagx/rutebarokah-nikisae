import React from "react";
import "./globals.css";
import AppNav from "@/components/mvp/AppNav.jsx";
import AppFooter from "@/components/mvp/AppFooter.jsx";

export const metadata = {
  title: "RuteBarokah MVP",
  description: "Platform kurasi dan matching UMKM halal berbasis rute untuk haji dan umrah.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="font-sans">
        <AppNav />
        {children}
        <AppFooter />
      </body>
    </html>
  );
}
