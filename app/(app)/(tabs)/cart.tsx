// @/app/(app)/(tabs)/cart.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { doc, updateDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { useRouter } from "expo-router";

const CartScreen = () => {
  const colorScheme = useColorScheme() || "light";
  const themeColors = Colors[colorScheme];
  const { user } = useAuth();
  const router = useRouter();

  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isWelcomeModalVisible, setIsWelcomeModalVisible] = useState(false);
  const [paymentCode, setPaymentCode] = useState("");

  const handleCheckout = () => {
    setIsPaymentModalVisible(true);
  };

  const handlePayment = async () => {
    if (paymentCode === "Fiboconomy") {
      if (!user) {
        Alert.alert("Fejl", "Bruger ikke logget ind.");
        return;
      }

      try {
        const userDocRef = doc(database, "users", user);
        await updateDoc(userDocRef, { role: "Designer" });

        console.log("Brugerens rolle ændret til Designer.");
        setIsPaymentModalVisible(false);
        setPaymentCode("");
        setIsWelcomeModalVisible(true); // Vis velkomstmodal
      } catch (error) {
        console.error("Fejl ved opdatering af brugerens rolle:", error);
        Alert.alert("Fejl", "Der opstod en fejl ved opdatering af din status.");
      }
    } else {
      Alert.alert("Fejl", "Ugyldig betalingskode. Prøv igen.");
    }
  };

  const handleWelcomeClose = () => {
    setIsWelcomeModalVisible(false);
    router.replace("/"); // Naviger til index.tsx
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.cartContainer}>
        {/* Abonnement detaljer */}
        <View style={styles.subscriptionDetails}>
          <Text style={[styles.subscriptionText, { color: themeColors.text }]}>
            Du får adgang til circShare
          </Text>
          <Text style={[styles.subscriptionText, { color: themeColors.text }]}>
            For 299 DKK pr. måned
          </Text>
          <Text style={[styles.subscriptionText, { color: themeColors.text }]}>
            Abonnementet giver dig også mulighed for at tilføje og dele dine egne circShare's.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.checkoutButton, styles.activeButton]}
        onPress={handleCheckout}
      >
        <Text style={styles.checkoutButtonText}>Gå til Betaling</Text>
      </TouchableOpacity>

      {/* Betalingsmodal */}
      <Modal
        visible={isPaymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Simuler Betaling</Text>
            <Text style={[styles.modalDescription, { color: themeColors.text }]}>
              Indtast betalingskode: "Fiboconomy"
            </Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: themeColors.icon, color: themeColors.text },
              ]}
              placeholder="Betalingskode"
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

      {/* Velkomstmodal */}
      <Modal
        visible={isWelcomeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleWelcomeClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Velkommen!</Text>
            <Text style={[styles.modalDescription, { color: themeColors.text }]}>
              Du er nu opgraderet til Designer med adgang til alle funktioner.
            </Text>
            <Text style={[styles.modalDescription, { color: themeColors.text }]}>
              Du skal logge ud og logge ind igen for at se ændringerne.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleWelcomeClose}
            >
              <Text style={styles.modalButtonText}>Fortsæt</Text>
            </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cartContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cartImage: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 30,
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  requestButton: {
    padding: 10,
    marginRight: 20,
  },
  removeButton: {
    padding: 10,
  },
  subscriptionDetails: {
    marginBottom: 16,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  subscriptionText: {
    fontSize: 20,
    lineHeight: 20,
    textAlign: "center",
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
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    height: "35%",
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
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  confirmButton: {
    width: "50%",
    height: "20%",
    backgroundColor: "#007AFF",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default CartScreen;
