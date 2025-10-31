
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  isGuest?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  isAuthenticated: boolean;
  isGuest: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for guest mode in localStorage
    const guestMode = localStorage.getItem('guestMode');
    if (guestMode === 'true') {
      setIsGuest(true);
      setUser({
        id: 'guest',
        name: 'Guest User',
        email: 'guest@travomate.com',
        isGuest: true
      });
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || session.user.email!.split('@')[0]
        });
        setIsAuthenticated(true);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || session.user.email!.split('@')[0]
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata.name || data.user.email!.split('@')[0]
        });
        setIsAuthenticated(true);
        toast.success("Login berhasil!");
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat login");
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat login dengan Google");
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.");
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat mendaftar");
      return false;
    }
  };

  const logout = async () => {
    try {
      // Clear guest mode if active
      if (isGuest) {
        localStorage.removeItem('guestMode');
        setIsGuest(false);
        setUser(null);
        toast.info("Anda telah keluar dari mode tamu");
        return;
      }

      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      toast.info("Anda telah keluar");
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat logout");
    }
  };

  const continueAsGuest = () => {
    localStorage.setItem('guestMode', 'true');
    setIsGuest(true);
    setUser({
      id: 'guest',
      name: 'Guest User',
      email: 'guest@travomate.com',
      isGuest: true
    });
    toast.success("Melanjutkan sebagai tamu - fitur terbatas");
  };

  const value = {
    user,
    login,
    loginWithGoogle,
    register,
    logout,
    continueAsGuest,
    isAuthenticated,
    isGuest,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
