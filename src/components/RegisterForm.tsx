import { useState, useCallback, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, Mail } from "lucide-react";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      } else if (password.length < 6) {
        newErrors.password = "Hasło musi mieć co najmniej 6 znaków";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors({ form: data.message || "Nie udało się utworzyć konta" });
          return;
        }

        // Show success message with email confirmation instruction
        setSuccessMessage(data.message);
      } catch {
        setErrors({ form: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie." });
      } finally {
        setIsLoading(false);
      }
    },
    [email, password]
  );

  // Show success message if registration was successful
  if (successMessage) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-green-500 bg-green-50 dark:bg-green-950 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
              <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-green-900 dark:text-green-100">Rejestracja prawie ukończona!</h3>
              <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Po kliknięciu w link aktywacyjny będziesz mógł się zalogować.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Lokalny development:</strong> Sprawdź emaile w Mailpit pod adresem{" "}
            <a
              href="http://127.0.0.1:54324"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              http://127.0.0.1:54324
            </a>
          </p>
        </div>

        <div className="text-center">
          <a href="/login" className="text-sm font-medium hover:underline">
            Przejdź do logowania
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
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
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          <p className="text-xs text-muted-foreground">Hasło musi mieć co najmniej 6 znaków</p>
        </div>
      </div>

      {errors.form && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{errors.form}</p>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            Tworzenie konta...
          </>
        ) : (
          <>
            <UserPlus />
            Zarejestruj się
          </>
        )}
      </Button>

      <div className="text-center">
        <span className="text-sm text-muted-foreground">Masz już konto? </span>
        <a href="/login" className="text-sm font-medium hover:underline">
          Zaloguj się
        </a>
      </div>
    </form>
  );
}
