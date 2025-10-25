import { render, RenderOptions } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "@/context/AuthContext.jsx";
import { User } from "@/types";

import { TestAuthProvider } from "./test-utils";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  user?: User | null;
  withRouter?: boolean;
}

export const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {},
) => {
  const { user, withRouter = true, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const content = withRouter
      ? React.createElement(BrowserRouter, null, children)
      : children;

    return React.createElement(TestAuthProvider, { user }, content);
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};
