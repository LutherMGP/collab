// @/components/indexcomponents/infopanels/InfoPanelStyles.tsx

import { StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

export const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    width: "94%",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  nameText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
  },
  f8Container: {
    flex: 8,
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
    position: "relative",
  },
  F8: {
    width: "94%",
    height: "98.7%",
    borderRadius: 10,
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    position: "relative",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  f8CoverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 10,
  },
  profileImageContainer: {
    position: "absolute",
    top: 5,
    left: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    width: 50, // Diameter
    height: 50, // Diameter
    borderRadius: 25, // Halv diameter for at bevare det runde udseende
    overflow: "hidden", // Sikrer, at billedet forbliver inden for grænserne
  },
  profileImage: {
    width: "100%", // Fylder hele containeren
    height: "100%", // Fylder hele containeren
    borderRadius: 25, // Halv diameter for at gøre det rundt
    resizeMode: "cover",
  },
  overlayContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },
  overlayImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  priceTag: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  deleteIconContainer: {
    position: "absolute",
    top: 5,
    right: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 15,
    padding: 5,
    zIndex: 10,
  },
  editIconContainer: {
    position: "absolute", // Absolut position for placering i nederste venstre hjørne
    bottom: 5, // Afstand fra bunden
    left: 5, // Afstand fra venstre
    padding: 6,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "gray", // Standardfarve
  },
  editEnabled: {
    backgroundColor: "green", // Farve når Edit-tilstand er aktiveret
  },
  editDisabled: {
    backgroundColor: "transparent", // Farve når Edit-tilstand er deaktiveret
  },
  editText: {
    marginLeft: 4,
    fontSize: 12,
  },
  lowerContainer: {
    flex: 5,
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  leftSide: {
    flex: 5,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  topSide: {
    flex: 5,
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  f2leftTop: {
    flex: 8,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    position: "relative",
  },
  F2: {
    width: "88%",
    height: "100%",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    position: "absolute",
    right: 0,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  f2CoverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 10,
  },
  rightTop: {
    flex: 5,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  f1topHalf: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  F1A: {
    width: "91.5%",
    height: "95%",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    position: "absolute",
    top: 0,
    right: 0,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  f1bottomHalf: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  F1B: {
    width: "91.5%",
    height: "95%",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  f3bottomSide: {
    flex: 8,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  F3: {
    width: "93%",
    height: "96%",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  f3CoverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 10,
  },
  f5Side: {
    flex: 8,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    position: "relative",
  },
  F5: {
    width: "93%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 0,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  f5CoverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 10,
  },
  text: {
    fontSize: 14,
    textAlign: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  separator: {
    height: 0.3,
    width: "100%",
    alignSelf: "center",
    marginBottom: "1.5%",
    marginTop: "3%",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent baggrund
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#2196F3",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  roundButtonF2: {
    position: "absolute",
    bottom: 5, // Behold placeringen i forhold til bunden
    left: 16, // Placér knappen til venstre, 10 px fra venstre kant
    width: "auto",
    height: "auto",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  roundButtonF3: {
    position: "absolute",
    bottom: 5, // Behold placeringen i forhold til bunden
    left: 15, // Placér knappen til venstre, 10 px fra venstre kant
    width: "auto",
    height: "auto",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  roundButtonF5: {
    position: "absolute",
    bottom: 5, // Behold placeringen i forhold til bunden
    left: 10, // Placér knappen til venstre, 10 px fra venstre kant
    width: "auto",
    height: "auto",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  roundButtonF8: {
    position: "absolute",
    bottom: 10, // Juster placeringen afhængigt af layoutet
    alignSelf: "center",
    width: "auto",
    height: "auto",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3, // Tilføj skygge for et bedre design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
