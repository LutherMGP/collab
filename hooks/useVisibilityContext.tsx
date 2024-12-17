// @/hooks/useVisibilityContext.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

type VisibilityContextType = {
  isInfoPanelProjectsVisible: boolean;
  isInfoPanelPublicatedVisible: boolean;
  isInfoPanelCatalogVisible: boolean;
  isInfoPanelFavoritesVisible: boolean;
  showPanel: (panelName: string) => void;
  hideAllPanels: () => void;
  activeButton: string | null;
  setActiveButton: (buttonName: string | null) => void;
};

const VisibilityContext = createContext<VisibilityContextType>({
  isInfoPanelProjectsVisible: false,
  isInfoPanelPublicatedVisible: false,
  isInfoPanelCatalogVisible: false,
  isInfoPanelFavoritesVisible: false,
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
  const [isInfoPanelFavoritesVisible, setInfoPanelFavoritesVisible] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const showPanel = (panelName: string) => {
    if (activeButton === panelName) {
      console.log(`Deaktiverer panel: ${panelName}`);
      hideAllPanels();
    } else {
      console.log(`Aktiverer panel: ${panelName}`);
      hideAllPanels();
  
      switch (panelName) {
        case "projects":
          if (!isInfoPanelProjectsVisible) {
            setInfoPanelProjectsVisible(true);
            console.log("isInfoPanelProjectsVisible sat til true");
          }
          break;
  
        case "publicated":
          if (!isInfoPanelPublicatedVisible) {
            setInfoPanelPublicatedVisible(true);
            console.log("isInfoPanelPublicatedVisible sat til true");
          }
          break;
  
        default:
          break;
      }
      setActiveButton(panelName);
    }
  };

  const hideAllPanels = () => {
    console.log("Nulstiller alle paneler...");
    setInfoPanelProjectsVisible(false);
    setInfoPanelPublicatedVisible(false);
    setInfoPanelCatalogVisible(false);
    setInfoPanelFavoritesVisible(false);
    setActiveButton(null);
    console.log("isInfoPanelProjectsVisible:", false);
    console.log("isInfoPanelPublicatedVisible:", false);
    console.log("isInfoPanelCatalogVisible:", false);
    console.log("isInfoPanelFavoritesVisible:", false);
  };

  return (
    <VisibilityContext.Provider
      value={{
        isInfoPanelProjectsVisible,
        isInfoPanelPublicatedVisible,
        isInfoPanelCatalogVisible,
        isInfoPanelFavoritesVisible,
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