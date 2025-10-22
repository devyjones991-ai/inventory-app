import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
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
const TestAuthProvider: React.FC<{ children: React.ReactNode; user?: User | null }> = ({ 
  children, 
  user = mockUser 
}) => {
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

  return (
    <AuthProvider value={mockAuthContext}>
      {children}
    </AuthProvider>
  );
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null;
  withRouter?: boolean;
}

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { user, withRouter = true, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    let content = children;
    
    if (withRouter) {
      content = <BrowserRouter>{content}</BrowserRouter>;
    }
    
    return (
      <TestAuthProvider user={user}>
        {content}
      </TestAuthProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
export { TestAuthProvider };
export { mockUser };
