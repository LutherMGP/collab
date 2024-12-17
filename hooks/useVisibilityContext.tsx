// @/hooks/useVisibilityContext.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

type VisibilityContextType = {
  isInfoPanelProjectsVisible: boolean;
  isInfoPanelPublicatedVisible: boolean;
  isInfoPanelCatalogVisible: boolean;
  isInfoPanelFavoritesVisible: boolean; // Ny state placeret her
  showPanel: (panelName: string) => void;
  hideAllPanels: () => void;
  activeButton: string | null;
  setActiveButton: (buttonName: string | null) => void;
};

const VisibilityContext = createContext<VisibilityContextType>({
  isInfoPanelProjectsVisible: false,
  isInfoPanelPublicatedVisible: false,
  isInfoPanelCatalogVisible: false,
  isInfoPanelFavoritesVisible: false, // Initialisering
  showPanel: () => {},
  hideAllPanels: () => {},
  activeButton: null,
  setActiveButton: () => {},
});

export const useVisibility = () => useContext(VisibilityContext);

export const VisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [isInfoPanelProjectsVisible, setInfoPanelProjectsVisible] = useState(false);
  const [isInfoPanelPublicatedVisible, setInfoPanelPublicatedVisible] = useState(false);
  const [isInfoPanelCatalogVisible, setInfoPanelCatalogVisible] = useState(false);
  const [isInfoPanelFavoritesVisible, setInfoPanelFavoritesVisible] = useState(false); // Ny state
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const showPanel = (panelName: string) => {
    hideAllPanels();
    switch (panelName) {
      case "projects":
        setInfoPanelProjectsVisible(true);
        setActiveButton("projects");
        break;
      case "publicated":
        setInfoPanelPublicatedVisible(true);
        setActiveButton("publicated");
        break;
      case "catalog":
        setInfoPanelCatalogVisible(true);
        setActiveButton("catalog");
        break;
      case "favorites": // Ny case
        setInfoPanelFavoritesVisible(true);
        setActiveButton("favorites");
        break;
      default:
        break;
    }
  };

  const hideAllPanels = () => {
    setInfoPanelProjectsVisible(false);
    setInfoPanelPublicatedVisible(false);
    setInfoPanelCatalogVisible(false);
    setInfoPanelFavoritesVisible(false); // Nulstil ny state
    setActiveButton(null);
  };

  return (
    <VisibilityContext.Provider
      value={{
        isInfoPanelProjectsVisible,
        isInfoPanelPublicatedVisible,
        isInfoPanelCatalogVisible,
        isInfoPanelFavoritesVisible, // Ny state mellem de andre
        showPanel,
        hideAllPanels,
        activeButton,
        setActiveButton,
      }}
    >
      {children}
    </VisibilityContext.Provider>
  );
};