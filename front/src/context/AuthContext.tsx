import React, { createContext, useState, useEffect, useContext } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  username?: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  avatar?: string;
  shopName?: string;
  shopDescription?: string;
  shopAvatar?: string;
  shopCover?: string;
  shopAddress?: string;
  _id?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAdmin: boolean;
  isSeller: boolean;
}

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType,
);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const normalizeUser = (value: User | null): User | null => {
    if (!value) return null;
    const normalizedId = value.id || value._id;
    if (!normalizedId) return value;
    return { ...value, id: normalizedId };
  };

  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? normalizeUser(JSON.parse(storedUser) as User) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  useEffect(() => {
    if (user && token) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [user, token]);

  const login = (userData: User, tokenData: string) => {
    setUser(normalizeUser(userData));
    setToken(tokenData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const isAdmin = user?.role === "admin";
  const isSeller = user?.role === "seller" || user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAdmin, isSeller }}
    >
      {children}
    </AuthContext.Provider>
  );
};



