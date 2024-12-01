// @/components/indexcomponents/infopanels/projects/InfoPanelProjects.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel from "@/components/indexcomponents/infopanels/projects/InfoPanel";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";

type ProjectData = {
  id: string;
  name?: string;
  comment?: string;
  status?: string;
  price?: number;
  f8?: string;
  f8PDF?: string;
  f8BrandImage?: string;
  f5?: string;
  f5PDF?: string;
  f3?: string;
  f3PDF?: string;
  f2?: string;
  f2PDF?: string;
  userId?: string | null;
};

const InfoPanelProjects = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  const config = {
    showFavorite: false, // true: favorit-ikonet kan benyttes (F1A)
    showPurchase: true, // true: purchase-ikonet kan benyttes (F1B)
    showDelete: true, // true: slet-knappen kan benyttes (F8
    showEdit: true, // true: redigerings-knappen kan benyttes (F8)
    showSnit: true, // true: pdf filen vises hvis der long-presses (F5)
    showGuide: true, // true: Viser guide-billede (F3)
  };

  useEffect(() => {
    if (!user) return;

    // Peg på den aktuelle brugers 'projects'-samling
    const userProjectsCollection = collection(
      database,
      "users",
      user,
      "projects"
    );
    const q = query(userProjectsCollection, where("status", "==", "Project"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Map data fra Firestore-dokumenter til en liste af projekter
        const fetchedProjects = snapshot.docs.map((doc) => {
          const data = doc.data();
          const documents = data.documents || {}; // Hent dokument-feltet, hvis det findes

          return {
            id: doc.id,
            name: data.name || "Uden navn",
            comment: data.comment || "Ingen kommentar",
            status: data.status || "Project",
            price: data.price || null,
            f8: documents.f8 || null, // Hent fra documents
            f8PDF: documents.f8PDF || null, // Hent fra documents
            f8BrandImage: data.f8BrandImage || null, // Direkte fra data
            f5: documents.f5 || null, // Hent fra documents
            f5PDF: documents.f5PDF || null, // Hent fra documents
            f3: documents.f3 || null, // Hent fra documents
            f3PDF: documents.f3PDF || null, // Hent fra documents
            f2: documents.f2 || null, // Hent fra documents
            f2PDF: documents.f2PDF || null, // Hent fra documents
            userId: user || null,
          };
        }) as ProjectData[];

        // Opdater state med de hentede projekter
        setProjects(fetchedProjects);

        // Tilføj console.log her for at spore de hentede projekter
        console.log("Hentede projekter:", fetchedProjects);

        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error("Fejl ved hentning af projekter:", err);
        setError("Kunne ikke hente projekter. Prøv igen senere.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (isLoading) {
    return (
      <View>
        <ActivityIndicator size="large" color={Colors[theme].text} />
      </View>
    );
  }

  if (error) {
    return (
      <View>
        <Text style={{ color: Colors[theme].text }}>{error}</Text>
      </View>
    );
  }

  return (
    <View>
      {projects.map((project) => (
        <InfoPanel key={project.id} projectData={project} config={config} />
      ))}
    </View>
  );
};

export default InfoPanelProjects;
