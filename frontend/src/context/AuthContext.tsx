import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  checkProfileStatus,
  getProfile,
  login as loginService,
  logout as logoutService,
  type LoginData,
  type UserProfile,
} from '../services/authService';
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  persistUser,
  storeAuthCredentials,
} from '../utils/authStorage';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginData, rememberMe: boolean) => Promise<{ hasProfile: boolean }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser<UserProfile>());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initialise = async () => {
      const token = getStoredToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profileResponse = await getProfile();
        setUser(profileResponse.user);
        persistUser(profileResponse.user);
      } catch (error) {
        console.error('Failed to load authenticated user profile:', error);
        clearStoredAuth();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void initialise();
  }, []);

  const login = useCallback(
    async (credentials: LoginData, rememberMe: boolean) => {
      setIsLoading(true);
      try {
        const authResponse = await loginService(credentials);
        storeAuthCredentials(authResponse, rememberMe);

        // Fetch latest profile data and profile completion status in parallel
        const [profileResponse, profileStatus] = await Promise.all([
          getProfile().catch(() => null),
          checkProfileStatus().catch(() => ({ hasProfile: false })),
        ]);

        if (profileResponse?.user) {
          setUser(profileResponse.user);
          persistUser(profileResponse.user);
        } else {
          setUser(authResponse.user);
          persistUser(authResponse.user);
        }

        return { hasProfile: profileStatus?.hasProfile ?? false };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    try {
      logoutService();
    } catch (error) {
      console.warn('Error during client logout:', error);
    }
    clearStoredAuth();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profileResponse = await getProfile();
      setUser(profileResponse.user);
      persistUser(profileResponse.user);
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshProfile,
    }),
    [user, isLoading, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
