import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { collection, query, where, onSnapshot, CollectionReference, DocumentData } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel from "@/components/indexcomponents/infopanels/projects/InfoPanel";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";

type ProjectData = {
  id: string;
  name?: string;
  description?: string; // Opdateret til 'description'
  status?: string;
  price?: number;
  f8CoverImage?: string; // Opdateret feltnavn
  f8PDF?: string;
  f8BrandImage?: string;
  f5CoverImage?: string; // Opdateret feltnavn
  f5PDF?: string;
  f3CoverImage?: string; // Opdateret feltnavn
  f3PDF?: string;
  f2CoverImage?: string; // Opdateret feltnavn
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
    showDelete: true, // true: slet-knappen kan benyttes (F8)
    showEdit: true, // true: redigerings-knappen kan benyttes (F8)
    showSnit: true, // true: pdf filen vises hvis der long-presses (F5)
    showGuide: true, // true: Viser guide-billede (F3)
  };

  useEffect(() => {
    if (!user) return;

    console.log("Fetching projects for user:", user); // Tilføj dette

    // Peg på den aktuelle brugers 'projects'-samling
    const userProjectsCollection = collection(database, "users", user, "projects");
    const q = query(userProjectsCollection, where("status", "==", "Project"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Map data fra Firestore-dokumenter til en liste af projekter
        const fetchedProjects = snapshot.docs.map((doc) => {
          const data = doc.data();

          console.log(`Project data for ${doc.id}:`, data); // Tilføj dette

          return {
            id: doc.id,
            name: data.name || "Uden navn",
            description: data.description || "Ingen kommentar", // Opdateret til 'description'
            status: data.status || "Project",
            price: data.price || null,
            f8CoverImage: data.f8CoverImage || null, // Opdateret feltnavn
            f8PDF: data.f8PDF || null,
            f8BrandImage: data.f8BrandImage || null,
            f5CoverImage: data.f5CoverImage || null, // Opdateret feltnavn
            f5PDF: data.f5PDF || null,
            f3CoverImage: data.f3CoverImage || null, // Opdateret feltnavn
            f3PDF: data.f3PDF || null,
            f2CoverImage: data.f2CoverImage || null, // Opdateret feltnavn
            f2PDF: data.f2PDF || null,
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