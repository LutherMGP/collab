// @/hooks/useVisibilityContext.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

interface VisibilityContextType {
  isInfoPanelProjectsVisible: boolean;
  isInfoPanelCircshareVisible: boolean;
  isInfoPanelPublishedVisible: boolean;
  isInfoPanelProductsVisible: boolean;
  isInfoPanelPurchasedVisible: boolean;
  isInfoPanelCartVisible: boolean;
  isInfoPanelDevelopmentVisible: boolean;
  showPanel: (
    panel:
      | "projects"
      | "circshare"
      | "published"
      | "products"
      | "purchased"
      | "cart"
      | "development"
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
  const [isInfoPanelCircshareVisible, setIsInfoPanelCircshareVisible] =
    useState(false);
  const [isInfoPanelPublishedVisible, setIsInfoPanelPublishedVisible] =
    useState(false);
  const [isInfoPanelProductsVisible, setIsInfoPanelProductsVisible] =
    useState(false);
  const [isInfoPanelPurchasedVisible, setIsInfoPanelPurchasedVisible] =
    useState(false);
  const [isInfoPanelCartVisible, setIsInfoPanelCartVisible] = useState(false);
  const [isInfoPanelDevelopmentVisible, setIsInfoPanelDevelopmentVisible] =
    useState(false);

  const showPanel = (
    panel:
      | "projects"
      | "circshare"
      | "published"
      | "products"
      | "purchased"
      | "cart"
      | "development"
  ) => {
    setIsInfoPanelProjectsVisible(panel === "projects");
    setIsInfoPanelCircshareVisible(panel === "circshare");
    setIsInfoPanelPublishedVisible(panel === "published");
    setIsInfoPanelProductsVisible(panel === "products");
    setIsInfoPanelPurchasedVisible(panel === "purchased");
    setIsInfoPanelCartVisible(panel === "cart");
    setIsInfoPanelDevelopmentVisible(panel === "development");
  };

  const hideAllPanels = () => {
    setIsInfoPanelProjectsVisible(false);
    setIsInfoPanelCircshareVisible(false);
    setIsInfoPanelPublishedVisible(false);
    setIsInfoPanelProductsVisible(false);
    setIsInfoPanelPurchasedVisible(false);
    setIsInfoPanelCartVisible(false);
    setIsInfoPanelDevelopmentVisible(false);
  };

  return (
    <VisibilityContext.Provider
      value={{
        isInfoPanelProjectsVisible,
        isInfoPanelCircshareVisible,
        isInfoPanelPublishedVisible,
        isInfoPanelProductsVisible,
        isInfoPanelPurchasedVisible,
        isInfoPanelCartVisible,
        isInfoPanelDevelopmentVisible,
        showPanel,
        hideAllPanels,
      }}
    >
      {children}
    </VisibilityContext.Provider>
  );
};
