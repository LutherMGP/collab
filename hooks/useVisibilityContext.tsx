// @/hooks/useVisibilityContext.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

type VisibilityContextType = {
  isInfoPanelProjectsVisible: boolean;
  isInfoPanelPublishedVisible: boolean;
  isInfoPanelCatalogVisible: boolean;
  isInfoPanelPurchasedVisible: boolean;
  isInfoPanelCartVisible: boolean;
  isInfoPanelApplicationsVisible: boolean;
  isInfoPanelApplicationsUdVisible: boolean;
  isInfoPanelApplicationsIndVisible: boolean;
  isInfoPanelDevelopmentVisible: boolean;
  showPanel: (panelName: string) => void;
  hideAllPanels: () => void;
  profileImage: string | null;
  setProfileImage: (imageUri: string) => void;
  statusFilter: "Project" | "Published"; // Tilføj denne linje
  setStatusFilter: (status: "Project" | "Published") => void; // Og denne linje
};

const VisibilityContext = createContext<VisibilityContextType>({
  isInfoPanelProjectsVisible: false,
  isInfoPanelPublishedVisible: false,
  isInfoPanelCatalogVisible: false,
  isInfoPanelPurchasedVisible: false,
  isInfoPanelCartVisible: false,
  isInfoPanelApplicationsVisible: false,
  isInfoPanelApplicationsUdVisible: false,
  isInfoPanelApplicationsIndVisible: false,
  isInfoPanelDevelopmentVisible: false,
  showPanel: () => {},
  hideAllPanels: () => {},
  profileImage: null,
  setProfileImage: () => {},
  statusFilter: "Project", // Initialværdi
  setStatusFilter: () => {},
});

export const useVisibility = () => useContext(VisibilityContext);

export const VisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [isInfoPanelProjectsVisible, setInfoPanelProjectsVisible] =
    useState(false);
  const [isInfoPanelPublishedVisible, setInfoPanelPublishedVisible] =
    useState(false);
  const [isInfoPanelCatalogVisible, setInfoPanelCatalogVisible] =
    useState(false);
  const [isInfoPanelPurchasedVisible, setInfoPanelPurchasedVisible] =
    useState(false);
  const [isInfoPanelCartVisible, setInfoPanelCartVisible] = useState(false);
  const [isInfoPanelApplicationsVisible, setInfoPanelApplicationsVisible] =
    useState(false);
  const [isInfoPanelDevelopmentVisible, setInfoPanelDevelopmentVisible] =
    useState(false);
  const [isInfoPanelApplicationsUdVisible, setInfoPanelApplicationsUdVisible] =
    useState(false);
  const [isInfoPanelApplicationsIndVisible, setInfoPanelApplicationsIndVisible] =
    useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Tilføj statusFilter state
  const [statusFilter, setStatusFilter] = useState<"Project" | "Published">(
    "Project"
  );

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
      case "applicationsUd":
        setInfoPanelApplicationsUdVisible(true);
        break;
      case "applicationsInd":
        setInfoPanelApplicationsIndVisible(true);
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
    setInfoPanelApplicationsUdVisible(false);
    setInfoPanelApplicationsIndVisible(false);
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
        isInfoPanelApplicationsUdVisible,
        isInfoPanelApplicationsIndVisible,
        isInfoPanelDevelopmentVisible,
        showPanel,
        hideAllPanels,
        profileImage,
        setProfileImage,
        statusFilter, // Tilføj dette
        setStatusFilter, // Og dette
      }}
    >
      {children}
    </VisibilityContext.Provider>
  );
};