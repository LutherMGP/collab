// @/hooks/useVisibilityContext.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

interface VisibilityContextType {
  isInfoPanelProjectsVisible: boolean;
  isInfoPanelPublishedVisible: boolean;
  isInfoPanelCatalogVisible: boolean;
  isInfoPanelFavoritesVisible: boolean;
  isInfoPanelProviderVisible: boolean;
  isInfoPanelApplicantVisible: boolean;
  isInfoPanelDueDiligenceVisible: boolean;
  isInfoPanelFiboShareVisible: boolean;
  isChatActive: boolean; // Ny tilstand for chat
  toggleChat: () => void; // Funktion til at skifte chattilstand
  showPanel: (
    panel:
      | "projects"
      | "published"
      | "catalog"
      | "favorites"
      | "provider"
      | "applicant"
      | "duediligence"
      | "fiboshare"
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
  const [isInfoPanelProviderVisible, setIsInfoPanelProviderVisible] =
    useState(false);
  const [isInfoPanelApplicantVisible, setIsInfoPanelApplicantVisible] =
    useState(false);
  const [isInfoPanelDueDiligenceVisible, setIsInfoPanelDueDiligenceVisible] =
    useState(false);
  const [isInfoPanelFiboShareVisible, setIsInfoPanelFiboShareVisible] =
    useState(false);
  const [isChatActive, setIsChatActive] = useState(false); // Chat-tilstand

  // Logfunktion
  const logVisibilityChange = (panel: string | null) => {
    if (panel) {
      console.log(`Visibility changed: ${panel} is now visible.`);
    } else {
      console.log("All panels are now hidden.");
    }
  };

  const showPanel = (
    panel:
      | "projects"
      | "published"
      | "catalog"
      | "favorites"
      | "provider"
      | "applicant"
      | "duediligence"
      | "fiboshare"
  ) => {
    setIsInfoPanelProjectsVisible(panel === "projects");
    setIsInfoPanelPublishedVisible(panel === "published");
    setIsInfoPanelCatalogVisible(panel === "catalog");
    setIsInfoPanelFavoritesVisible(panel === "favorites");
    setIsInfoPanelProviderVisible(panel === "provider");
    setIsInfoPanelApplicantVisible(panel === "applicant");
    setIsInfoPanelDueDiligenceVisible(panel === "duediligence");
    setIsInfoPanelFiboShareVisible(panel === "fiboshare");
    logVisibilityChange(panel); // Log hvilken panel der blev aktiveret
  };

  const hideAllPanels = () => {
    setIsInfoPanelProjectsVisible(false);
    setIsInfoPanelPublishedVisible(false);
    setIsInfoPanelCatalogVisible(false);
    setIsInfoPanelFavoritesVisible(false);
    setIsInfoPanelProviderVisible(false);
    setIsInfoPanelApplicantVisible(false);
    setIsInfoPanelDueDiligenceVisible(false);
    setIsInfoPanelFiboShareVisible(false);
    logVisibilityChange(null); // Log at alle panels er skjult
  };

  const toggleChat = () => {
    setIsChatActive((prev) => !prev);
    console.log("Chat-tilstand opdateret:", !isChatActive);
  };

  return (
    <VisibilityContext.Provider
      value={{
        isInfoPanelProjectsVisible,
        isInfoPanelPublishedVisible,
        isInfoPanelCatalogVisible,
        isInfoPanelFavoritesVisible,
        isInfoPanelProviderVisible,
        isInfoPanelApplicantVisible,
        isInfoPanelDueDiligenceVisible,
        isInfoPanelFiboShareVisible,
        isChatActive, // Inkluder chat-tilstand
        toggleChat, // Tilføj toggleChat-funktion
        showPanel,
        hideAllPanels,
      }}
    >
      {children}
    </VisibilityContext.Provider>
  );
};