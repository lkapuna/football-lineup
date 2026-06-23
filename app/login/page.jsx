"use client";

import { useRouter } from "next/navigation";
import LoginCard from "@/components/LoginCard";
import { APP_VERSION } from "@/lib/version";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="app-page login-page">
      <section className="panel login-panel">
        <div className="brand">
          <p className="eyebrow">מערכת הרכבים v{APP_VERSION}</p>
          <h1>כניסת משתמש</h1>
          <p className="muted">הזן שם וטלפון. אם הטלפון כבר קיים, השם חייב להיות זהה לשחקן הרשום.</p>
        </div>
        <LoginCard onLogin={() => router.push("/")} />
      </section>
    </main>
  );
}
