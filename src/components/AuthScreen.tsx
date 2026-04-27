import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

export function AuthScreen() {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const nextError = await signIn(email, password);
    setError(nextError);
    setSubmitting(false);
  }

  return (
    <div className="center-screen auth-screen">
      <div className="status-card auth-card">
        <span className="eyebrow">{t("appName")}</span>
        <h1>Fleet operations, without the spreadsheet chaos.</h1>
        <p>{t("authSubtitle")}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>{t("email")}</span>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="captain@example.com"
              type="email"
              value={email}
            />
          </label>

          <label>
            <span>{t("password")}</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              value={password}
            />
          </label>

          <button disabled={submitting} type="submit">
            {submitting ? "..." : t("signIn")}
          </button>
        </form>

        {!isSupabaseConfigured && <p className="inline-note">{t("supabaseMissing")}</p>}
        {error && <p className="inline-error">{error}</p>}
      </div>
    </div>
  );
}

