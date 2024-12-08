// @/hooks/useVisibilityContext.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

type VisibilityContextType = {
  isInfoPanelProjectsVisible: boolean;
  isInfoPanelPublishedVisible: boolean;
  isInfoPanelCatalogVisible: boolean;
  isInfoPanelPurchasedVisible: boolean;
  isInfoPanelCartVisible: boolean;
  isInfoPanelApplicationsVisible: boolean;
  isInfoPanelDevelopmentVisible: boolean;
  showPanel: (panelName: string) => void;
  hideAllPanels: () => void;
};

const VisibilityContext = createContext<VisibilityContextType>({
  isInfoPanelProjectsVisible: false,
  isInfoPanelPublishedVisible: false,
  isInfoPanelCatalogVisible: false,
  isInfoPanelPurchasedVisible: false,
  isInfoPanelCartVisible: false,
  isInfoPanelApplicationsVisible: false,
  isInfoPanelDevelopmentVisible: false,
  showPanel: () => {},
  hideAllPanels: () => {},
});

export const useVisibility = () => useContext(VisibilityContext);

export const VisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [isInfoPanelProjectsVisible, setInfoPanelProjectsVisible] = useState(false);
  const [isInfoPanelPublishedVisible, setInfoPanelPublishedVisible] = useState(false);
  const [isInfoPanelCatalogVisible, setInfoPanelCatalogVisible] = useState(false);
  const [isInfoPanelPurchasedVisible, setInfoPanelPurchasedVisible] = useState(false);
  const [isInfoPanelCartVisible, setInfoPanelCartVisible] = useState(false);
  const [isInfoPanelApplicationsVisible, setInfoPanelApplicationsVisible] = useState(false);
  const [isInfoPanelDevelopmentVisible, setInfoPanelDevelopmentVisible] = useState(false);

  const showPanel = (panelName: string) => {
    hideAllPanels();
    switch (panelName) {
      case "projects":
        setInfoPanelProjectsVisible(true);
        break;
      case "published":
        setInfoPanelPublishedVisible(true);
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
      case "applications":
        setInfoPanelApplicationsVisible(true);
        break;
      case "development":
        setInfoPanelDevelopmentVisible(true);
        break;
      default:
        break;
    }
  };

  const hideAllPanels = () => {
    setInfoPanelProjectsVisible(false);
    setInfoPanelPublishedVisible(false);
    setInfoPanelCatalogVisible(false);
    setInfoPanelPurchasedVisible(false);
    setInfoPanelCartVisible(false);
    setInfoPanelApplicationsVisible(false);
    setInfoPanelDevelopmentVisible(false);
  };

  return (
    <VisibilityContext.Provider
      value={{
        isInfoPanelProjectsVisible,
        isInfoPanelPublishedVisible,
        isInfoPanelCatalogVisible,
        isInfoPanelPurchasedVisible,
        isInfoPanelCartVisible,
        isInfoPanelApplicationsVisible,
        isInfoPanelDevelopmentVisible,
        showPanel,
        hideAllPanels,
      }}
    >
      {children}
    </VisibilityContext.Provider>
  );
};