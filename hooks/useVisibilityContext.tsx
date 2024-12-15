// @/hooks/useVisibilityContext.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

type VisibilityContextType = {
  isInfoPanelProjectsVisible: boolean;
  isInfoPanelCatalogVisible: boolean;
  isInfoPanelPurchasedVisible: boolean;
  isInfoPanelCartVisible: boolean;
  isInfoPanelApplicationsVisible: boolean;
  isInfoPanelApplicationsUdVisible: boolean;
  isInfoPanelApplicationsIndVisible: boolean;
  showPanel: (panelName: string) => void;
  hideAllPanels: () => void;
  profileImage: string | null; // Tilføj dette
  setProfileImage: (imageUri: string) => void; // Og dette
};

const VisibilityContext = createContext<VisibilityContextType>({
  isInfoPanelProjectsVisible: false,
  isInfoPanelCatalogVisible: false,
  isInfoPanelPurchasedVisible: false,
  isInfoPanelCartVisible: false,
  isInfoPanelApplicationsVisible: false,
  isInfoPanelApplicationsUdVisible: false,
  isInfoPanelApplicationsIndVisible: false,
  showPanel: () => {},
  hideAllPanels: () => {},
  profileImage: null,
  setProfileImage: () => {},
});

export const useVisibility = () => useContext(VisibilityContext);

export const VisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [isInfoPanelProjectsVisible, setInfoPanelProjectsVisible] =
    useState(false);
  const [isInfoPanelCatalogVisible, setInfoPanelCatalogVisible] =
    useState(false);
  const [isInfoPanelPurchasedVisible, setInfoPanelPurchasedVisible] =
    useState(false);
  const [isInfoPanelCartVisible, setInfoPanelCartVisible] = 
    useState(false);
  const [isInfoPanelApplicationsVisible, setInfoPanelApplicationsVisible] =
    useState(false);
  const [isInfoPanelApplicationsUdVisible, setInfoPanelApplicationsUdVisible] =
    useState(false);
  const [isInfoPanelApplicationsIndVisible, setInfoPanelApplicationsIndVisible] =
    useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null); // Tilføj dette

  const showPanel = (panelName: string) => {
    hideAllPanels();
    switch (panelName) {
      case "projects":
        setInfoPanelProjectsVisible(true);
        break;
      case "catalog":
        setInfoPanelCatalogVisible(true);
        break;
      case "purchased":
        setInfoPanelPurchasedVisible(true);
        break;
      case "cart":
        setInfoPanelCartVisible(true);
        break;
      case "applicationsUd":
        setInfoPanelApplicationsUdVisible(true);
        break;
      case "applicationsInd":
        setInfoPanelApplicationsIndVisible(true);
        break;
      default:
        break;
    }
  };

  const hideAllPanels = () => {
    setInfoPanelProjectsVisible(false);
    setInfoPanelCatalogVisible(false);
    setInfoPanelPurchasedVisible(false);
    setInfoPanelCartVisible(false);
    setInfoPanelApplicationsVisible(false);
    setInfoPanelApplicationsUdVisible(false);
    setInfoPanelApplicationsIndVisible(false);
  };

  return (
    <VisibilityContext.Provider
      value={{
        isInfoPanelProjectsVisible,
        isInfoPanelCatalogVisible,
        isInfoPanelPurchasedVisible,
        isInfoPanelCartVisible,
        isInfoPanelApplicationsVisible,
        isInfoPanelApplicationsUdVisible,
        isInfoPanelApplicationsIndVisible,
        showPanel,
        hideAllPanels,
        profileImage, // Tilføj dette
        setProfileImage, // Og dette
      }}
    >
      {children}
    </VisibilityContext.Provider>
  );
};