import React from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export const Layout: React.FC<Props> = ({ children }) => {
  return (
    <>
      <nav>navbar</nav>
      <main>{children}</main>;
    </>
  );
};
