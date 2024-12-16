// @/hooks/useVisibilityContext.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

type ActivePanelType = "Project" | "Published" | "Catalog" | "Favorite" | null; // Definer specifikke paneltyper for bedre typekontrol

type VisibilityContextType = {
  activePanel: ActivePanelType; // Det aktive panel, hvis nogen
  setActivePanel: (panelName: ActivePanelType) => void; // Funktion til at opdatere aktivt panel
  profileImage: string | null; // Brugerens profilbillede, hvis et er valgt
  setProfileImage: (imageUri: string | null) => void; // Funktion til at opdatere profilbilledet
};

const VisibilityContext = createContext<VisibilityContextType>({
  activePanel: null, // Standard: ingen aktive paneler
  setActivePanel: () => {},
  profileImage: null, // Standard: ingen profilbillede
  setProfileImage: () => {},
});

export const useVisibility = () => useContext(VisibilityContext);

export const VisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [activePanel, setActivePanel] = useState<ActivePanelType>(null); // Initialiserer uden noget aktivt panel
  const [profileImage, setProfileImage] = useState<string | null>(null); // Initialiserer uden et valgt profilbillede

  // Debugging: Log ændringer i activePanel for at spore opdateringer
  React.useEffect(() => {
    console.log("Active panel updated:", activePanel);
  }, [activePanel]);

  return (
    <VisibilityContext.Provider
      value={{
        activePanel,
        setActivePanel,
        profileImage,
        setProfileImage,
      }}
    >
      {children}
    </VisibilityContext.Provider>
  );
};