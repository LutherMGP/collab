// @/hooks/useVisibilityContext.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

type VisibilityContextType = {
  activePanel: string | null; // Navnet på det aktive panel (dynamisk)
  setActivePanel: (panelName: string | null) => void; // Funktion til at sætte aktivt panel
  profileImage: string | null; // Profilbillede
  setProfileImage: (imageUri: string) => void; // Funktion til at opdatere profilbillede
};

const VisibilityContext = createContext<VisibilityContextType>({
  activePanel: null, // Ingen paneler er aktive som standard
  setActivePanel: () => {},
  profileImage: null,
  setProfileImage: () => {},
});

export const useVisibility = () => useContext(VisibilityContext);

export const VisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [activePanel, setActivePanel] = useState<string | null>(null); // Dynamisk håndtering af aktive paneler
  const [profileImage, setProfileImage] = useState<string | null>(null); // Profilbillede

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