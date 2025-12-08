import { useState, useCallback, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";

export function PasswordResetForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Reset errors
      setErrors({});

      // Client-side validation
      const newErrors: { password?: string; confirmPassword?: string } = {};

      if (!password) {
        newErrors.password = "Hasło jest wymagane";
      } else if (password.length < 6) {
        newErrors.password = "Hasło musi mieć co najmniej 6 znaków";
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = "Potwierdzenie hasła jest wymagane";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Hasła nie są identyczne";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        });

        if (!response.ok) {
          const data = await response.json();
          setErrors({
            form: data.message || "Nie udało się zresetować hasła",
          });
          return;
        }

        setIsSuccess(true);
      } catch {
        setErrors({
          form: "Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [password, confirmPassword]
  );

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
            <CheckCircle2 className="size-8 text-green-600 dark:text-green-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Hasło zostało zmienione</h2>
          <p className="text-muted-foreground">
            Twoje hasło zostało pomyślnie zresetowane. Możesz teraz zalogować się używając nowego hasła.
          </p>
        </div>
        <Button asChild className="w-full">
          <a href="/login">Przejdź do logowania</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nowe hasło</Label>
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            aria-invalid={!!errors.confirmPassword}
            className={errors.confirmPassword ? "border-destructive" : ""}
          />
          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
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
            Resetowanie...
          </>
        ) : (
          <>
            <Lock />
            Zresetuj hasło
          </>
        )}
      </Button>

      <div className="text-center">
        <a href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Powrót do logowania
        </a>
      </div>
    </form>
  );
}
