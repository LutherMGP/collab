// @/components/indexcomponents/dashboard/Catalog.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import {
  collectionGroup,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";

interface Project {
  id: string;
  ownerId: string;
  [key: string]: any;
}

const Catalog = () => {
  const theme = "light";
  const { user } = useAuth();
  const { isInfoPanelCatalogVisible, showPanel, hideAllPanels } =
    useVisibility();

  const [productCount, setProductCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchProducts = async () => {
      const allProductsQuery = query(
        collectionGroup(database, "projects"),
        where("status", "==", "Published")
      );

      const unsubscribe = onSnapshot(allProductsQuery, (snapshot) => {
        const allProductIds = snapshot.docs.map((doc) => ({
          id: doc.id,
          ownerId: doc.ref.parent.parent?.id || null,
          ...doc.data(),
        }));

        const availableProducts = allProductIds.filter(
          ({ ownerId }) => ownerId !== user
        );

        setProductCount(availableProducts.length);
      });

      return () => unsubscribe();
    };

    fetchProducts().catch((error) => {
      console.error("Fejl ved hentning af produkter:", error);
      Alert.alert("Fejl", "Kunne ikke hente produkter.");
    });
  }, [user]);

  const handleApply = (project: Project) => {
    setSelectedProject(project);
    setModalVisible(true);
  };

  const submitApplication = async () => {
    if (!selectedProject) {
      Alert.alert("Fejl", "Ingen projekt valgt.");
      return;
    }

    if (!applicationMessage.trim()) {
      Alert.alert("Fejl", "Skriv en besked før du sender ansøgningen.");
      return;
    }

    try {
      const applicationRef = doc(
        database,
        "users",
        selectedProject.ownerId,
        "projects",
        selectedProject.id,
        "applications",
        `${user}_${Date.now()}`
      );

      await setDoc(applicationRef, {
        applicantId: user,
        message: applicationMessage.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Ansøgning sendt!", "Din ansøgning er blevet sendt.");
      setApplicationMessage("");
      setModalVisible(false);
    } catch (error) {
      console.error("Fejl ved indsendelse af ansøgning:", error);
      Alert.alert("Fejl", "Kunne ikke sende ansøgningen. Prøv igen.");
    }
  };

  return (
    <View style={[styles.createStoryContainer]}>
      <Image
        source={require("@/assets/images/offerings.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelCatalogVisible ? styles.iconPressed : null,
        ]}
        onPress={() => {
          if (isInfoPanelCatalogVisible) hideAllPanels();
          else showPanel("catalog");
        }}
      >
        <Text style={styles.productCountText}>{productCount}</Text>
      </TouchableOpacity>

      <View style={styles.createStoryTextContainer}>
        <Text style={[styles.createStoryText, { color: Colors[theme].text }]}>
          Catalog
        </Text>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ansøg om projekt</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Skriv din besked..."
              value={applicationMessage}
              onChangeText={setApplicationMessage}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Annuller</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitApplication}
              >
                <Text style={styles.buttonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  profileImg: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  createStoryContainer: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    position: "relative",
    paddingBottom: 10,
    height: 180,
    width: 120,
    alignSelf: "flex-start",
    overflow: "hidden",
    marginLeft: 5,
  },
  iconContainer: {
    position: "absolute",
    top: 108,
    left: "50%",
    transform: [{ translateX: -20 }],
    borderRadius: 50,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    width: 40,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconPressed: {
    backgroundColor: "rgba(0, 128, 0, 0.8)",
  },
  productCountText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  createStoryTextContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    height: 40,
    display: "flex",
    borderColor: Colors.light.background,
  },
  createStoryText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    width: "100%",
    marginBottom: 20,
    textAlignVertical: "top",
    height: 80,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default Catalog;