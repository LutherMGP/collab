// @/hooks/useVisibilityContext.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

interface VisibilityContextType {
  isInfoPanelProjectsVisible: boolean;
  isInfoPanelPublishedVisible: boolean;
  isInfoPanelCatalogVisible: boolean;
  isInfoPanelFavoritesVisible: boolean;
  showPanel: (
    panel:
      | "projects"
      | "published"
      | "catalog"
      | "favorites"
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
  const [isInfoPanelProjectsVisible, setIsInfoPanelProjectsVisible] =
    useState(false);
  const [isInfoPanelPublishedVisible, setIsInfoPanelPublishedVisible] =
    useState(false);
  const [isInfoPanelCatalogVisible, setIsInfoPanelCatalogVisible] =
  useState(false);
  const [isInfoPanelFavoritesVisible, setIsInfoPanelFavoritesVisible] =
  useState(false);  
  const showPanel = (
    panel:
      | "projects"
      | "published"
      | "catalog"
      | "favorites"
  ) => {
    setIsInfoPanelProjectsVisible(panel === "projects");
    setIsInfoPanelPublishedVisible(panel === "published");
    setIsInfoPanelCatalogVisible(panel === "catalog");
    setIsInfoPanelFavoritesVisible(panel === "favorites");
  };

  const hideAllPanels = () => {
    setIsInfoPanelProjectsVisible(false);
    setIsInfoPanelPublishedVisible(false);
    setIsInfoPanelCatalogVisible(false);
    setIsInfoPanelFavoritesVisible(false);
  };

  return (
    <VisibilityContext.Provider
      value={{
        isInfoPanelProjectsVisible,
        isInfoPanelPublishedVisible,
        isInfoPanelCatalogVisible,
        isInfoPanelFavoritesVisible,
        showPanel,
        hideAllPanels,
      }}
    >
      {children}
    </VisibilityContext.Provider>
  );
};
