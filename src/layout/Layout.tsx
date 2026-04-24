import React from "react";
import { Avatar } from "@base-ui/react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export const Layout: React.FC<Props> = ({ children }) => {
  return (
    <>
      <header className="flex">
        <Avatar>R</Avatar>
      </header>
      <main>{children}</main>;
    </>
  );
};
