import { useState, useCallback, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2 } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Reset errors
      setErrors({});

      // Client-side validation
      const newErrors: { email?: string; password?: string } = {};

      if (!email.trim()) {
        newErrors.email = "Adres e-mail jest wymagany";
      } else if (!validateEmail(email)) {
        newErrors.email = "Adres e-mail jest nieprawidłowy";
      }

      if (!password) {
        newErrors.password = "Hasło jest wymagane";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json();
          setErrors({ form: data.message || "Nieprawidłowe dane logowania" });
          return;
        }

        // Reload page to update session state
        window.location.href = "/";
      } catch {
        setErrors({ form: "Wystąpił błąd podczas logowania. Spróbuj ponownie." });
      } finally {
        setIsLoading(false);
      }
    },
    [email, password]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-test-id="login-form">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="twoj@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            aria-invalid={!!errors.email}
            className={errors.email ? "border-destructive" : ""}
            data-test-id="login-email-input"
          />
          {errors.email && <p className="text-sm text-destructive" data-test-id="login-email-error">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Hasło</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            aria-invalid={!!errors.password}
            className={errors.password ? "border-destructive" : ""}
            data-test-id="login-password-input"
          />
          {errors.password && <p className="text-sm text-destructive" data-test-id="login-password-error">{errors.password}</p>}
        </div>
      </div>

      {errors.form && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3" data-test-id="login-form-error">
          <p className="text-sm text-destructive">{errors.form}</p>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full" data-test-id="login-submit-button">
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            Logowanie...
          </>
        ) : (
          <>
            <LogIn />
            Zaloguj się
          </>
        )}
      </Button>

      <div className="text-center">
        <a href="/password-recovery" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Zapomniałeś hasła?
        </a>
      </div>
    </form>
  );
}
