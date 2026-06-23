import "./globals.css";
import { Palette } from "lucide-react";
import { APP_VERSION, DEVELOPER_CREDIT } from "@/lib/version";

export const metadata = {
  title: "הרכבי כדורגל שבועיים",
  description: "ניהול קבוצות כדורגל שבועיות",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        {children}
        <a
          className="drawing-promo"
          href="https://romi-drawing-game.onrender.com"
          target="_blank"
          rel="noreferrer"
          dir="rtl"
        >
          <Palette className="drawing-logo" size={26} aria-hidden="true" />
          <span>
            <strong>משחק מציירים ביחד</strong>
            <small>משחק יצירתי לשחק עם הילדים או עם החברים אונליין</small>
          </span>
          <b>פתחו עכשיו</b>
        </a>
        <footer className="app-credit" dir="ltr">
          v{APP_VERSION} · Developed by {DEVELOPER_CREDIT}
        </footer>
      </body>
    </html>
  );
}
