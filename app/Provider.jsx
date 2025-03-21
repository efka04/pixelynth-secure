'use client';

import { SessionProvider } from "next-auth/react";
import { CategoryProvider } from "./context/CategoryContext";
import { SearchProvider } from "./context/OptimizedSearchContext";
import { ColorProvider } from "./context/ColorContext";

export default function Provider({ children }) {
  return (
    <SessionProvider>
      <CategoryProvider>
        <ColorProvider>
          <SearchProvider>
            {children}
          </SearchProvider>
        </ColorProvider>
      </CategoryProvider>
    </SessionProvider>
  );
}
