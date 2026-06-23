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
        <footer className="app-credit" dir="ltr">
          v{APP_VERSION} · Developed by {DEVELOPER_CREDIT}
        </footer>
      </body>
    </html>
  );
}
