import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

const normalizeUser = (user) => {
  if (typeof user === "string") {
    return { email: user };
  }

  return user
    ? {
        id: user.id || user._id,
        email: user.email,
      }
    : null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("wysa_token");

      if (!token) {
        setIsReady(true);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setUser(normalizeUser(response.data.data.user));
      } catch {
        localStorage.removeItem("wysa_token");
      } finally {
        setIsReady(true);
      }
    };

    restoreSession();
  }, []);

  const authenticate = async (path, credentials) => {
    const response = await api.post(path, credentials);
    localStorage.setItem("wysa_token", response.data.data.token);
    setUser(normalizeUser(response.data.data.user));
  };

  const value = useMemo(
    () => ({
      user,
      isReady,
      login: (credentials) => authenticate("/auth/login", credentials),
      register: (credentials) => authenticate("/auth/register", credentials),
      logout: () => {
        localStorage.removeItem("wysa_token");
        setUser(null);
      },
    }),
    [user, isReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
