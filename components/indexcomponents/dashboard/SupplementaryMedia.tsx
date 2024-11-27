// @/components/indexcomponents/dashboard/SupplementaryMedia.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Entypo } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, getDocs } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { MediaItem } from "@/constants/types/index";

interface Asset {
  id: string;
  name: string;
  type: "Billede" | "PDF" | "Video";
  coverUrl?: string; // Kun for PDF'er
  url?: string; // For billeder og videoer
}

const SupplementaryMedia: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelectMedia: (selectedMedia: Asset[]) => void;
  initialMediaItems: MediaItem[]; // Tilføjet som en obligatorisk prop
  onAddMedia?: (media: MediaItem) => void; // Gør onAddMedia valgfri
  onRemoveMedia?: (id: string) => void; // Gør onRemoveMedia valgfri
}> = ({ visible, onClose, onSelectMedia, initialMediaItems }) => {
  const { user } = useAuth();
  const [media, setMedia] = useState<Asset[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>(
    initialMediaItems.map((item) => item.id) // Brug initialMediaItems til at forhåndsudfylde
  );

  // Hent medier fra Firestore
  useEffect(() => {
    if (!user) return;

    const userId = typeof user === "string" ? user : "";

    const fetchMedia = async () => {
      try {
        const assetsRef = collection(database, "users", userId, "assets");
        const q = query(assetsRef);
        const snapshot = await getDocs(q);

        const mediaData: Asset[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          type: doc.data().type,
          coverUrl: doc.data().coverUrl, // For PDF'er
          url: doc.data().imageUrl, // Bruger imageUrl i stedet for url
        }));

        setMedia(mediaData);
      } catch (error) {
        console.error("Fejl ved hentning af medier:", error);
      }
    };

    fetchMedia();
  }, [user]);

  // Håndter valg/fravalg af medier
  const toggleMediaSelection = (id: string) => {
    if (selectedMedia.includes(id)) {
      setSelectedMedia(selectedMedia.filter((mediaId) => mediaId !== id)); // Fjern fra valgte
    } else {
      setSelectedMedia([...selectedMedia, id]); // Tilføj til valgte
    }
  };

  // Når user trykker på 'Luk', send de valgte medier tilbage via callback
  const handleClose = () => {
    const selectedMediaData = media.filter((item) =>
      selectedMedia.includes(item.id)
    );
    onSelectMedia(selectedMediaData); // Send de valgte medier til parent-komponenten
    onClose(); // Luk modalen
  };

  // Render et enkelt medieelement
  const renderMediaItem = ({ item }: { item: Asset }) => {
    const isSelected = selectedMedia.includes(item.id);

    return (
      <TouchableOpacity
        onPress={() => toggleMediaSelection(item.id)}
        style={[styles.mediaItem, isSelected && styles.selectedMedia]}
      >
        {item.type === "Video" ? (
          <Entypo name="video" size={40} color={Colors.light.text} />
        ) : (
          <Image
            source={{ uri: item.type === "PDF" ? item.coverUrl : item.url }}
            style={styles.mediaImage}
          />
        )}
        {isSelected && <View style={styles.selectionMarker} />}
        <Text style={styles.mediaName}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Supplerende Medier</Text>

          {/* Billeder */}
          <Text style={styles.sectionTitle}>Billeder</Text>
          <FlatList
            data={media.filter((item) => item.type === "Billede")}
            renderItem={renderMediaItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.mediaRow}
          />

          {/* PDF'er */}
          <Text style={styles.sectionTitle}>PDF'er</Text>
          <FlatList
            data={media.filter((item) => item.type === "PDF")}
            renderItem={renderMediaItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.mediaRow}
          />

          {/* Videoer */}
          <Text style={styles.sectionTitle}>Videoer</Text>
          <FlatList
            data={media.filter((item) => item.type === "Video")}
            renderItem={renderMediaItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.mediaRow}
          />

          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Luk</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
  },
  mediaRow: {
    marginBottom: 15,
  },
  mediaItem: {
    alignItems: "center",
    marginRight: 10,
  },
  mediaImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
  },
  mediaName: {
    marginTop: 5,
    fontSize: 10,
    textAlign: "center",
  },
  selectedMedia: {
    // borderWidth: 2,
    // borderColor: Colors.light.tint,
  },
  selectionMarker: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 10,
    height: 10,
    backgroundColor: "white",
    // backgroundColor: Colors.light.tint,
    borderRadius: 5,
  },
  closeButton: {
    alignSelf: "center",
    backgroundColor: Colors.light.tint,
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default SupplementaryMedia;
