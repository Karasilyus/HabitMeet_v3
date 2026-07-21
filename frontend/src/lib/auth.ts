import { useEffect, useState } from "react";

import { getStoredUser, getToken, type User } from "./api";

// SSR güvenli oturum bilgisi: localStorage yalnızca istemcide okunur.
// refreshKey değiştiğinde (örn. sayfa geçişi) oturum yeniden okunur;
// böylece giriş/kayıt sonrası eski (stale) kullanıcı bilgisi yüzünden
// tekrar giriş sayfasına fırlatılma sorunu yaşanmaz.
export function useAuth(refreshKey?: unknown) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getToken() ? getStoredUser() : null);
    setReady(true);
  }, [refreshKey]);

  return { ready, user };
}
