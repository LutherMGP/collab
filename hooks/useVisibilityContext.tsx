// @/hooks/useVisibilityContext.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

interface VisibilityContextType {
  activePanel: "projects" | "published" | "catalog" | "favorites" | null;
  showPanel: (
    panel: "projects" | "published" | "catalog" | "favorites"
  ) => void;
  hideAllPanels: () => void;
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(
  undefined
);

export const useVisibility = () => {
  const context = useContext(VisibilityContext);
  if (context === undefined) {
    throw new Error("useVisibility must be used within a VisibilityProvider");
  }
  return context;
};

interface VisibilityProviderProps {
  children: ReactNode;
}

export const VisibilityProvider: React.FC<VisibilityProviderProps> = ({
  children,
}) => {
  const [activePanel, setActivePanel] = useState<
    "projects" | "published" | "catalog" | "favorites" | null
  >(null);

  const showPanel = (
    panel: "projects" | "published" | "catalog" | "favorites"
  ) => {
    setActivePanel(panel); // Kun én panel kan være aktiv ad gangen
  };

  const hideAllPanels = () => {
    setActivePanel(null);
  };

  return (
    <VisibilityContext.Provider
      value={{
        activePanel,
        showPanel,
        hideAllPanels,
      }}
    >
      {children}
    </VisibilityContext.Provider>
  );
};