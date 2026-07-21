import { useEffect, useState } from "react";

import { getStoredUser, getToken, type User } from "./api";

// SSR güvenli oturum bilgisi: localStorage yalnızca istemcide okunur.
export function useAuth() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getToken() ? getStoredUser() : null);
    setReady(true);
  }, []);

  return { ready, user };
}
