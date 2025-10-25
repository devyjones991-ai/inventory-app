import React from "react";
import { AuthProvider } from "../src/context/AuthContext";
import { User } from "../src/types";

// Mock user for tests
const mockUser: User = {
  id: "test-user-id",
  email: "test@example.com",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  user_metadata: {
    username: "testuser",
    full_name: "Test User",
  },
};

// Mock AuthProvider for tests
const TestAuthProvider: React.FC<{
  children: React.ReactNode;
  user?: User | null;
}> = ({ children, user = mockUser }) => {
  const mockAuthContext = {
    user,
    role: "user",
    isLoading: false,
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPassword: vi.fn().mockResolvedValue({ error: null }),
    updatePassword: vi.fn().mockResolvedValue({ error: null }),
    refreshUser: vi.fn().mockResolvedValue(undefined),
  };

  return <AuthProvider value={mockAuthContext}>{children}</AuthProvider>;
};

// Export only components for React Refresh
export { TestAuthProvider };
