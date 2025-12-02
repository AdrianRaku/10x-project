import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export interface UserMenuProps {
  userEmail?: string;
  userName?: string;
}

export function UserMenu({ userEmail, userName }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get user initials from name or email
  const getInitials = useCallback(() => {
    if (userName) {
      return userName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (userEmail) {
      return userEmail[0].toUpperCase();
    }
    return "U";
  }, [userName, userEmail]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        window.location.href = "/login";
      } else {
        setIsLoggingOut(false);
      }
    } catch {
      setIsLoggingOut(false);
    }
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* User Avatar/Initials */}
      <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5">
        <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
          {getInitials()}
        </div>
        {(userName || userEmail) && (
          <span className="hidden text-sm font-medium sm:inline">{userName || userEmail}</span>
        )}
      </div>

      {/* Logout Button */}
      <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoggingOut} aria-label="Wyloguj się">
        <LogOut />
        <span className="hidden sm:inline">Wyloguj</span>
      </Button>
    </div>
  );
}
