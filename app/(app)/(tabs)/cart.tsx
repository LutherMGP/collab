// @/app/(app)/(tabs)/cart.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "@/hooks/useAuth";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { useRouter } from "expo-router";

type PurchaseItem = {
  id: string;
  projectId: string;
  projectOwnerId: string;
  purchased: boolean;
  projectData?: ProjectData;
};

type ProjectData = {
  id: string;
  name: string;
  price: number;
  image: string;
  pdfPath: string;
};

const CartScreen = () => {
  const colorScheme = useColorScheme() || "light";
  const themeColors = Colors[colorScheme];
  const { user } = useAuth();
  const router = useRouter();

  const [cartItems, setCartItems] = useState<PurchaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentCode, setPaymentCode] = useState("");

  useEffect(() => {
    if (!user) {
      console.warn("Bruger ikke logget ind.");
      setIsLoading(false);
      return;
    }

    const purchasesRef = collection(database, "users", user, "purchases");
    const q = query(purchasesRef, where("purchased", "==", false));

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        const purchases: PurchaseItem[] = [];

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const projectId = data.projectId;
          const projectOwnerId = data.projectOwnerId;

          if (!projectId || !projectOwnerId) {
            console.warn(
              `Purchase ${docSnap.id} har manglende projektId eller ejerId.`
            );
            continue;
          }

          const projectDocRef = doc(
            database,
            "users",
            projectOwnerId,
            "project",
            projectId
          );
          const projectDocSnap = await getDoc(projectDocRef);

          if (projectDocSnap.exists()) {
            const projectData = projectDocSnap.data();
            purchases.push({
              id: docSnap.id,
              projectId: projectId,
              projectOwnerId: projectOwnerId,
              purchased: data.purchased,
              projectData: {
                id: projectDocSnap.id,
                name: projectData.name || "Uden navn",
                price: projectData.price || 0,
                image: projectData.image || "",
                pdfPath: projectData.pdfPath || "",
              },
            });
          } else {
            console.warn(`Projekt dokumentet ${projectId} findes ikke.`);
          }
        }

        setCartItems(purchases);
        setIsLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Fejl ved hentning af køb:", error);
        setError("Der opstod en fejl ved hentning af data.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleRemove = async (purchaseId: string) => {
    if (!user) return;

    try {
      const purchaseDocRef = doc(
        database,
        "users",
        user,
        "purchases",
        purchaseId
      );
      await deleteDoc(purchaseDocRef);
      console.log(`Purchase ${purchaseId} fjernet fra kurven.`);
    } catch (error) {
      console.error("Fejl ved fjernelse af køb:", error);
      Alert.alert("Fejl", "Der opstod en fejl ved fjernelse af købet.");
    }
  };

  const handleCheckout = () => {
    setIsPaymentModalVisible(true);
  };

  const handlePayment = async () => {
    if (paymentCode === "Betaling") {
      if (!user) {
        Alert.alert("Fejl", "Bruger ikke logget ind.");
        return;
      }

      for (const item of cartItems) {
        try {
          // Marker projektet som købt
          const purchaseDocRef = doc(
            database,
            "users",
            user,
            "purchases",
            item.id
          );
          await updateDoc(purchaseDocRef, { purchased: true });

          // Tilføj salget til ejerens `sales`-kollektion
          const projectOwnerId = item.projectOwnerId;
          const saleDocRef = doc(
            database,
            "users",
            projectOwnerId,
            "sales",
            item.projectId // Brug projekt-ID som dokumentnavn
          );
          await setDoc(
            saleDocRef,
            {
              projectId: item.projectId,
              buyerId: user,
              price: item.projectData?.price || 0,
              soldAt: new Date().toISOString(),
            },
            { merge: true }
          );

          console.log(`Køb og salg af projekt ${item.projectId} håndteret.`);
        } catch (error) {
          console.error(`Fejl ved opdatering af køb ${item.id}:`, error);
        }
      }

      setIsPaymentModalVisible(false);
      setPaymentCode("");
      router.replace("/");
    } else {
      Alert.alert("Fejl", "Ugyldig betalingskode.");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.cartContainer}>
        {isLoading ? (
          <Text style={[styles.emptyCartText, { color: themeColors.text }]}>
            Indlæser...
          </Text>
        ) : cartItems.length === 0 ? (
          <Text style={[styles.emptyCartText, { color: themeColors.text }]}>
            Din kurv er tom.
          </Text>
        ) : (
          cartItems.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image
                source={
                  item.projectData?.image
                    ? { uri: item.projectData.image }
                    : require("@/assets/images/join-full.png")
                }
                style={styles.cartImage}
              />
              <View style={styles.cartDetails}>
                <Text style={[styles.itemTitle, { color: themeColors.text }]}>
                  {item.projectData?.name || "Uden navn"}
                </Text>
                <Text
                  style={[styles.itemPrice, { color: themeColors.text }]}
                >{`${item.projectData?.price} DKK`}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemove(item.id)}
              >
                <FontAwesome name="trash" size={20} color="gray" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {cartItems.length > 0 && (
        <View style={styles.totalContainer}>
          <Text style={[styles.totalText, { color: themeColors.text }]}>
            Total:{" "}
            {cartItems.reduce(
              (acc, item) => acc + (item.projectData?.price || 0),
              0
            )}{" "}
            DKK
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.checkoutButton,
          cartItems.length === 0 ? styles.disabledButton : styles.activeButton,
        ]}
        disabled={cartItems.length === 0}
        onPress={handleCheckout}
      >
        <Text style={styles.checkoutButtonText}>Gå til Betaling</Text>
      </TouchableOpacity>

      <Modal
        visible={isPaymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Simuler Betaling
            </Text>
            <Text
              style={[styles.modalDescription, { color: themeColors.text }]}
            >
              Indtast betalingskode for at gennemføre købet.
            </Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: themeColors.icon, color: themeColors.text },
              ]}
              placeholder="Betaling"
              placeholderTextColor={themeColors.icon}
              value={paymentCode}
              onChangeText={setPaymentCode}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsPaymentModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Annuller</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handlePayment}
              >
                <Text style={styles.modalButtonText}>Bekræft</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  cartContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ccc",
    padding: 10,
  },
  cartImage: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  cartDetails: {
    flex: 1,
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemPrice: {
    fontSize: 14,
    color: "#888",
  },
  removeButton: {
    padding: 10,
  },
  totalContainer: {
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingTop: 10,
    marginBottom: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "right",
  },
  checkoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "#007AFF",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyCartText: {
    textAlign: "center",
    fontSize: 18,
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  confirmButton: {
    backgroundColor: "#007AFF",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default CartScreen;
