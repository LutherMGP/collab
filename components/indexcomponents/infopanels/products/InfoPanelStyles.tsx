// @/components/indexcomponents/infopanels/products/InfoPanelStyles.tsx

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
    justifyContent: "flex-start", // Placér indholdet øverst
    alignItems: "center", // Centrer indholdet vandret
    // paddingTop: 5, // Giv afstand fra toppen
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
  projectImageContainer: {
    position: "absolute",
    top: 5,
    left: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    width: 50, // Diameter
    height: 50, // Diameter
    borderRadius: 25, // Halv diameter for at bevare det runde udseende
    elevation: 4, // Tilføj skygge for bedre design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  projectImage: {
    width: "100%", // Fylder hele containeren
    height: "100%", // Fylder hele containeren
    borderRadius: 25, // Halv diameter for at gøre det rundt
    resizeMode: "cover",
  },
  priceTag: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent baggrund
    borderRadius: 20, // Rund knap
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4, // Tilføj skygge for bedre design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent baggrund
    borderRadius: 20, // Rund knap
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4, // Tilføj skygge for bedre design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 0,
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
    height: "96.5%",
    borderRadius: 10,
    justifyContent: "flex-start",
    alignItems: "center",
    // paddingTop: 10,
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
    justifyContent: "flex-start",
    alignItems: "center",
    // paddingTop: 5,
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
  textTag: {
    position: "absolute", // Placer den relativt til containeren
    top: 5, // Placering tæt på toppen
    width: "auto", // Fyld hele bredden
    alignItems: "center", // Centrerer horisontalt
    zIndex: 1, // Sørger for, at teksten altid er øverst
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent baggrund
    borderRadius: 20, // Rund knap
    padding: 4,
    paddingTop: 2,
    paddingBottom: 2,
    justifyContent: "center",
    elevation: 4, // Tilføj skygge for bedre design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  text: {
    fontSize: 10,
    textAlign: "center", // Centrer teksten vandret
    color: "#000", // Tilføj farve for synlighed
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
  commentButtonf8: {
    position: "absolute", // Gør det muligt at placere knappen præcist
    bottom: 5, // Juster afhængigt af ønsket placering
    left: 5, // Juster afhængigt af ønsket placering
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent baggrund
    borderRadius: 20, // Rund knap
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4, // Tilføj skygge for bedre design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  commentButtonf5: {
    position: "absolute", // Gør det muligt at placere knappen præcist
    bottom: 5, // Juster afhængigt af ønsket placering
    left: 5, // Juster afhængigt af ønsket placering
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent baggrund
    borderRadius: 20, // Rund knap
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4, // Tilføj skygge for bedre design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  commentButtonf3: {
    position: "absolute", // Gør det muligt at placere knappen præcist
    bottom: 5, // Juster afhængigt af ønsket placering
    left: 5, // Juster afhængigt af ønsket placering
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent baggrund
    borderRadius: 20, // Rund knap
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4, // Tilføj skygge for bedre design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  commentButtonf2: {
    position: "absolute", // Gør det muligt at placere knappen præcist
    bottom: 6, // Juster afhængigt af ønsket placering
    left: 17, // Juster afhængigt af ønsket placering
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent baggrund
    borderRadius: 20, // Rund knap
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4, // Tilføj skygge for bedre design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  attachmentButton: {
    position: "absolute", // Gør det muligt at placere knappen præcist
    bottom: 5, // Juster afhængigt af afstanden fra bunden
    left: "50%", // Placer midt horisontalt i forhold til forælderen
    transform: [{ translateX: -20 }], // Flyt tilbage med halvdelen af knappen bredde for at centrere
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent baggrund
    borderRadius: 20, // Rund knap
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4, // Tilføj skygge for bedre design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
