import "./globals.css";
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
          <span>משחק מציירים ביחד</span>
          <strong>פתחו עכשיו</strong>
        </a>
        <footer className="app-credit" dir="ltr">
          v{APP_VERSION} · Developed by {DEVELOPER_CREDIT}
        </footer>
      </body>
    </html>
  );
}
