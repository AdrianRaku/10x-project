import { useState, useCallback, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";

export function PasswordRecoveryForm() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string; form?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Reset errors and success
      setErrors({});
      setIsSuccess(false);

      // Client-side validation
      const newErrors: { email?: string } = {};

      if (!email.trim()) {
        newErrors.email = "Adres e-mail jest wymagany";
      } else if (!validateEmail(email)) {
        newErrors.email = "Adres e-mail jest nieprawidłowy";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/auth/password-recovery", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          setErrors({ form: "Wystąpił błąd. Spróbuj ponownie." });
          return;
        }

        setIsSuccess(true);
      } catch {
        setErrors({ form: "Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie." });
      } finally {
        setIsLoading(false);
      }
    },
    [email]
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
          <h2 className="text-xl font-semibold">Sprawdź swoją skrzynkę e-mail</h2>
          <p className="text-muted-foreground">
            Jeśli konto z adresem <strong className="text-foreground">{email}</strong> istnieje, wysłaliśmy na nie
            instrukcje odzyskiwania hasła.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <a href="/login">Powrót do logowania</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        <p className="text-xs text-muted-foreground">Wyślemy instrukcje odzyskiwania hasła na podany adres e-mail</p>
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
            Wysyłanie...
          </>
        ) : (
          <>
            <Mail />
            Wyślij instrukcje
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
