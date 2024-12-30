// @/components/indexcomponents/infopanels/duediligence/InfoPanel5.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import { doc, getDoc, setDoc, DocumentData, collection, addDoc, Timestamp, onSnapshot } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { database, storage } from "@/firebaseConfig";
import InfoPanelF8 from "@/components/indexcomponents/infopanels/duediligence/Infopanelmodals/f8f5f3f2/InfoPanelF8";
import InfoPanelF5 from "@/components/indexcomponents/infopanels/duediligence/Infopanelmodals/f8f5f3f2/InfoPanelF5";
import InfoPanelF3 from "@/components/indexcomponents/infopanels/duediligence/Infopanelmodals/f8f5f3f2/InfoPanelF3";
import InfoPanelF2 from "@/components/indexcomponents/infopanels/duediligence/Infopanelmodals/f8f5f3f2/InfoPanelF2";
import InfoPanelNameComment from "@/components/indexcomponents/infopanels/duediligence/Infopanelmodals/namecomment/InfoPanelNameComment";
import InfoPanelPrize from "@/components/indexcomponents/infopanels/duediligence/Infopanelmodals/prize/InfoPanelPrize";
import InfoPanelProjectImage from "@/components/indexcomponents/infopanels/duediligence/Infopanelmodals/projectimage/InfoPanelProjectImage";
import InfoPanelCommentModal from "@/components/indexcomponents/infopanels/duediligence/Infopanelmodals/comment/InfoPanelCommentModal";
import InfoPanelAttachment from "@/components/indexcomponents/infopanels/duediligence/Infopanelmodals/attachment/InfoPanelAttachment";
import InfoPanelCircular from "@/components/indexcomponents/infopanels/duediligence/Infopanelmodals/circular/InfoPanelCircular";
import InfoPanelLegal from "@/components/indexcomponents/infopanels/duediligence/Infopanelmodals/legal/InfoPanelLegal";
import { Colors } from "@/constants/Colors";
import { styles as baseStyles } from "@/components/indexcomponents/infopanels/duediligence/InfoPanelStyles5";
import { FilePaths } from "@/utils/filePaths";

type CircularEconomyData = {
  waterUsage: { value: number; description: string };
  CO2Emission: { value: number; description: string };
};

type ProjectData = {
  id: string;
  name: string; // Default-værdi kan være en tom streng
  description: string;
  status: string;
  transferMethod: string;
  legalDescription?: string | null;
  circularEconomy?: CircularEconomyData; 
  f8CoverImageLowRes?: string | null;
  f5CoverImageLowRes?: string | null;
  f3CoverImageLowRes?: string | null;
  f2CoverImageLowRes?: string | null;
  projectImage?: string | null;
  userId?: string | null;
};

type InfoPanelProps = {
  projectData: ProjectData;
  chatData?: DocumentData; // Ny prop til chatdata
  setIsChatActive: (isActive: boolean) => void;
  onUpdate?: (updatedProject: ProjectData) => void; // Callback til opdatering
};

const InfoPanel5 = ({ projectData: initialProjectData, chatData, onUpdate }: InfoPanelProps) => {
  const theme = useColorScheme() || "light";
  const { width } = Dimensions.get("window");
  const height = (width * 8) / 5;
  const rightMargin = width * 0.03;

  const { user: currentUser } = useAuth();
  const userId = currentUser;

  // Definer projectData som en state-variabel
  const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);
  const [selectedOption, setSelectedOption] = useState<string | null>(null); 
  const [showFullComment, setShowFullComment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isEditEnabled, setIsEditEnabled] = useState(false);
  const [isF8ModalVisible, setIsF8ModalVisible] = useState(false);
  const [isF5ModalVisible, setIsF5ModalVisible] = useState(false);
  const [isF3ModalVisible, setIsF3ModalVisible] = useState(false);
  const [isF2ModalVisible, setIsF2ModalVisible] = useState(false);
  const [isNameCommentModalVisible, setIsNameCommentModalVisible] = useState(false);
  const [isPrizeModalVisible, setIsPrizeModalVisible] = useState(false);
  const [isProjectImageModalVisible, setIsProjectImageModalVisible] = useState(false);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"f8" | "f5" | "f3" | "f2" | null>(null);
  const [isAttachmentModalVisible, setIsAttachmentModalVisible] = useState(false);
  const [isCircularModalVisible, setIsCircularModalVisible] = useState(false);
  const [isLegalModalVisible, setIsLegalModalVisible] = useState(false); // Tilføjet state for Legal Modal
  const [refreshKey, setRefreshKey] = useState(0);
  const { isChatActive, toggleChat } = useVisibility(); // Brug den nye tilstand og funktion
  const [newMessage, setNewMessage] = useState(""); // State for beskedinput
  const [messages, setMessages] = useState(chatData?.messages || []); // Chatbeskeder

  // Tjek for manglende data
  if (!projectData || !projectData.id || !userId) {
    return (
      <View style={baseStyles.container}>
        <Text>Data mangler. Tjek dine props.</Text>
      </View>
    );
  }

  // Synchroniser local state med props
  useEffect(() => {
    setProjectData(initialProjectData);
  }, [initialProjectData]);

  // Din toggleEdit funktion
  const toggleEdit = () => {
    if (chatData?.userId === currentUser) {
      setIsEditEnabled((prev) => !prev); // Skifter tilstanden for Edit
    } else {
      Alert.alert("Adgang nægtet", "Kun provideren kan redigere dette projekt.");
    }
  };

  // Funktion til at sende en besked  
  type ChatMessage = {
    sender: string;
    text: string;
  };

  // Real-time opdatering af chatbeskeder
  useEffect(() => {
    if (!projectData.id) return;

    const chatDocRef = doc(database, "chats", projectData.id);
    const messagesCollection = collection(chatDocRef, "messages");

    const unsubscribe = onSnapshot(messagesCollection, (snapshot) => {
      const updatedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(updatedMessages); // Opdater beskeder
    });

    return () => unsubscribe(); // Ryd op ved unmount
  }, [projectData.id]); // Afhængighed af projectData.id
  
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
  
    const newChatMessage = {
      sender: currentUser || "Unknown",
      text: newMessage.trim(),
      timestamp: Timestamp.now(),
    };
  
    try {
      const chatDocRef = doc(database, "chats", projectData.id);
      const messagesCollection = collection(chatDocRef, "messages");
      await addDoc(messagesCollection, newChatMessage);
  
      setNewMessage(""); // Ryd inputfeltet
    } catch (error) {
      console.error("Fejl ved afsendelse af besked:", error);
    }
  };

  // Funktion til at opdatere projektdata efter ændringer
  const refreshProjectData = async () => {
    if (!userId || !projectData.id) return;
  
    setIsLoading(true);
  
    try {
      // Hent data fra Firestore
      const docRef = doc(database, "users", userId, "projects", projectData.id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProjectData((prev) => ({
          ...prev,
          name: data.name || "",
          description: data.description || "",
          legalDescription: data.legalDescription || prev.legalDescription || null, // Tilføjet hentning af legalDescription
          f8CoverImageLowRes: data.f8CoverImageLowRes || prev.f8CoverImageLowRes || null,
          f5CoverImageLowRes: data.f5CoverImageLowRes || prev.f5CoverImageLowRes || null,
          f3CoverImageLowRes: data.f3CoverImageLowRes || prev.f3CoverImageLowRes || null,
          f2CoverImageLowRes: data.f2CoverImageLowRes || prev.f2CoverImageLowRes || null,
          projectImage: data.projectImage || prev.projectImage || null,
          status: data.status || prev.status || "",
          transferMethod: data.transferMethod || prev.transferMethod || "",
          circularEconomy: data.circularEconomy || prev.circularEconomy || undefined,
        }));
      }
    } catch (error) {
      console.error("Fejl ved opdatering af projektdata:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere projektdata.");
    } finally {
      setIsLoading(false);
    }
  };

  // Funktion til opdatering af transferMethod og pris
  const updateTransferMethod = (newMethod: string) => {
    // Opdater kun transferMethod i projektdata
    setProjectData((prev) => ({
      ...prev,
      transferMethod: newMethod, // Opdater metoden
    }));
  };

  // Generisk håndtering af lang tryk (PDF on-demand, så pass null)
  const handleLongPress = async (pdfType: "f8PDF" | "f5PDF" | "f3PDF" | "f2PDF") => {
    if (!userId || !projectData.id) {
      Alert.alert("Fejl", "Bruger-ID eller projekt-ID mangler.");
      return;
    }
  
    try {
      // Generer stien til PDF'en baseret på typen
      const category = pdfType.replace("PDF", "") as "f8" | "f5" | "f3" | "f2";
      const pdfPath = FilePaths.pdf(userId, projectData.id, category);
      const pdfRef = ref(storage, pdfPath);
  
      // Hent download-URL fra Firebase Storage
      const downloadURL = await getDownloadURL(pdfRef);
  
      // Åbn PDF'en med iOS-vieweren
      await Linking.openURL(downloadURL);
    } catch (error) {
      console.error(`Fejl ved åbning af PDF for ${pdfType}:`, error);
      Alert.alert("Fejl", `Kunne ikke hente PDF for ${pdfType}. Prøv igen.`);
    }
  };

  // Generisk handlePress funktion med conditional
  const handlePress = async (button: string) => {
    if (isEditEnabled) {
      // Åbn modal, hvis Edit er aktiveret
      switch (button) {
        case "F8":
          setIsF8ModalVisible(true);
          break;
        case "F5":
          setIsF5ModalVisible(true);
          break;
        case "F3":
          setIsF3ModalVisible(true);
          break;
        case "F2":
          setIsF2ModalVisible(true);
          break;
        default:
          Alert.alert("Knappen blev trykket", `Du trykkede på: ${button}`);
      }
    } else {
      // Vis HighRes-billede, hvis Edit er deaktiveret
      try {
        const category = button.replace("F", "f") as "f8" | "f5" | "f3" | "f2";
        const highResPath = FilePaths.coverImage(userId, projectData.id, category, "HighRes");
        const highResRef = ref(storage, highResPath);
        const highResURL = await getDownloadURL(highResRef);
        await Linking.openURL(highResURL); // Åbner billedet i iOS-vieweren
      } catch (error) {
        console.error(`Fejl ved hentning af HighRes-billede for ${button}:`, error);
        Alert.alert("Fejl", `Kunne ikke hente HighRes-billede for ${button}.`);
      }
    }
  };

  // Funktioner til at lukke modaler
  const closeF8Modal = () => {
    setIsF8ModalVisible(false);
    refreshProjectData(); // Opdater data efter lukning
  };

  const closeF5Modal = () => {
    setIsF5ModalVisible(false);
    refreshProjectData();
  };

  const closeF3Modal = () => {
    setIsF3ModalVisible(false);
    refreshProjectData();
  };

  const closeF2Modal = () => {
    setIsF2ModalVisible(false);
    refreshProjectData();
  };

  const closeNameCommentModal = () => {
    setIsNameCommentModalVisible(false);
    refreshProjectData();
  };

  const closePrizeModal = () => {
    setIsPrizeModalVisible(false);
    refreshProjectData();
  };

  const closeProjectImageModal = () => {
    setIsProjectImageModalVisible(false);
    setRefreshKey((prevKey) => prevKey + 1); // Tving opdatering
    refreshProjectData(); // Opdater data, inkl. billed-URL
  };

  const handleOpenCommentModal = (category: "f8" | "f5" | "f3" | "f2") => {
    setActiveCategory(category);
    setIsCommentModalVisible(true);
  };

  const handleCloseCommentModal = () => {
    setActiveCategory(null);
    setIsCommentModalVisible(false);
  };

  const openAttachmentModal = () => {
    setIsAttachmentModalVisible(true);
  };

  const closeAttachmentModal = () => {
    setIsAttachmentModalVisible(false);
  };

  // Funktion til at skifte status fra og til published
  const handleStatusToggle = async () => {
    try {
      if (!userId || !projectData.id) {
        throw new Error("Bruger-ID eller projekt-ID mangler.");
      }

      const isCurrentlyPublished = projectData.status === "Published";
      const newStatus = isCurrentlyPublished ? "Project" : "Published";

      // Bekræftelse før statusændring
      Alert.alert(
        isCurrentlyPublished ? "Fjern Publicering" : "Bekræft Publicering",
        isCurrentlyPublished
          ? "Vil du ændre status til 'Project'? Dette vil gøre projektet privat igen."
          : "Vil du ændre status til 'Published'? Projektet bliver synligt for andre.",
        [
          {
            text: "Annuller",
            style: "cancel",
          },
          {
            text: isCurrentlyPublished ? "Gør Privat" : "Publicer",
            style: "default",
            onPress: async () => {
              try {
                const projectDocRef = doc(database, "users", userId, "projects", projectData.id);
                await setDoc(projectDocRef, { status: newStatus }, { merge: true });

                Alert.alert(
                  "Status Opdateret",
                  newStatus === "Published"
                    ? "Projektet er nu publiceret."
                    : "Projektet er nu tilbage som kladde."
                );

                setProjectData((prev) => ({ ...prev, status: newStatus })); // Opdater lokalt
              } catch (error) {
                console.error("Fejl ved opdatering af status:", error);
                Alert.alert("Fejl", "Kunne ikke opdatere status. Prøv igen senere.");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Fejl ved skift af status:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere status. Prøv igen senere.");
    }
  };

  // Funktion til at håndtere "Prize"-feltet
  const handlePrizePress = () => {
    if (isEditEnabled) {
      setIsPrizeModalVisible(true); // Åbn modal i redigeringstilstand
    } else {
      fetchTransferMethod(); // Hent data on-demand
    }
  };

  // Funktion til at hente transferMethod fra Firestore
  const fetchTransferMethod = async () => {
    if (!userId || !projectData.id) {
      Alert.alert("Fejl", "Bruger-ID eller projekt-ID mangler.");
      return;
    }
  
    try {
      const docRef = doc(database, "users", userId, "projects", projectData.id);
      const snapshot = await getDoc(docRef);
  
      if (snapshot.exists()) {
        const data = snapshot.data();
        const transferMethod = data.transferMethod || "Ingen beskrivelse tilgængelig";
        Alert.alert("Transfer Method", transferMethod);
      } else {
        Alert.alert("Fejl", "Projektdata blev ikke fundet.");
      }
    } catch (error) {
      console.error("Fejl ved hentning af transferMethod:", error);
      Alert.alert("Fejl", "Kunne ikke hente transferMethod.");
    }
  };

  return (
    <ScrollView contentContainerStyle={[baseStyles.container, { height }]}>
      {/* Tekst og kommentarer */}
      <View style={baseStyles.textContainer}>
        <Text
          style={[baseStyles.nameText, { color: Colors[theme].tint }]}
          onPress={() => handlePress("Name & Comment")}
        >
          {projectData.name || "Uden navn"}
        </Text>
        <Text
          style={[baseStyles.commentText, { color: Colors[theme].text }]}
          numberOfLines={showFullComment ? undefined : 1}
          ellipsizeMode="tail"
          onPress={() => {
            handlePress("Name & Comment");
            setShowFullComment(!showFullComment);
          }}
        >
          {projectData.description || "Ingen kommentar"}
        </Text>
      </View>

      {/* F8 felt */}
      <View style={baseStyles.f8Container}>
        <Pressable
          style={baseStyles.F8}
          onPress={() => {
            if (!isChatActive) {
              handlePress("F8"); // Standardfunktionalitet
            }
          }}
          onLongPress={() => {
            if (!isChatActive) {
              handleLongPress("f8PDF"); // Standardfunktionalitet
            }
          }}
          accessibilityLabel="F8 Button"
        >
          {isChatActive ? (
            // Chat-UI
            <View style={styles.chatContainer}>
              <ScrollView contentContainerStyle={styles.chatMessages}>
                {messages.map((message: ChatMessage, index: number) => (
                  <Text
                    key={index}
                    style={[
                      styles.chatMessage,
                      message.sender === currentUser
                        ? styles.chatMessageSender
                        : styles.chatMessageReceiver,
                    ]}
                  >
                    {message.text}
                  </Text>
                ))}
              </ScrollView>
              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Skriv en besked..."
                  value={newMessage}
                  onChangeText={setNewMessage}
                />
                <Pressable
                  style={styles.chatSendButton}
                  onPress={sendMessage}
                  accessibilityLabel="Send Message Button"
                >
                  <AntDesign name="arrowup" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
          ) : (
            // Standard `f8CoverImageLowRes` indhold
            <>
              {projectData.f8CoverImageLowRes && (
                <Image
                  source={{
                    uri: `${projectData.f8CoverImageLowRes}?timestamp=${Date.now()}`, // Tilføj timestamp
                  }}
                  style={baseStyles.f8CoverImage}
                />
              )}
              {/* Tekst i toppen */}
              <View style={baseStyles.textTag}>
                <Text style={baseStyles.text}>Specification</Text>
              </View>
            </>
          )}

          {/* Chat-knap */}
          <Pressable
            style={baseStyles.deleteIconContainer} // Behold eksisterende styling
            onPress={toggleChat} // Brug contextens toggleChat
            accessibilityLabel="Chat Toggle Button"
          >
            <AntDesign
              name={isChatActive ? "picture" : "wechat"} // Skifter ikon afhængigt af tilstanden
              size={32}
              color={isChatActive ? "#0a7ea4" : "#0a7ea4"} // Dynamisk farve
            />
          </Pressable>
        </Pressable>
      </View>

      {/* Nedre container */}
      <View style={baseStyles.lowerContainer}>
        <View style={baseStyles.leftSide}>
          <View style={baseStyles.topSide}>
            <View style={baseStyles.f2leftTop}>
              <Pressable
                style={baseStyles.F2}
                onPress={() => handlePress("F2")}
                onLongPress={() => handleLongPress("f2PDF")}
                accessibilityLabel="F2 Button"
              >
                {/* Vis billede, hvis det er tilgængeligt */}
                {projectData.f2CoverImageLowRes && (
                  <Image
                    source={{
                      uri: `${projectData.f2CoverImageLowRes}?timestamp=${Date.now()}`, // Tilføj timestamp
                    }}
                    style={baseStyles.f2CoverImage}
                  />
                )}

                {/* Tekst i f2 toppen */}
                <View style={baseStyles.textTag}>
                  <Text style={baseStyles.text}>Agreement</Text>
                </View>
              </Pressable>

              {/* Comment-knap f2 */}
              <Pressable
                style={baseStyles.commentButtonf2}
                onPress={() => handleOpenCommentModal("f2")}
              >
                <AntDesign name="message1" size={20} color="#0a7ea4" />
              </Pressable>
            </View>
            <View style={baseStyles.rightTop}>
              <View style={baseStyles.f1topHalf}>
                <Pressable
                  style={baseStyles.F1A}
                  onPress={toggleEdit} // Brug den eksisterende toggleEdit funktion
                  accessibilityLabel="Edit Button"
                >
                  <AntDesign
                    name="edit" // Ikon ændret til "edit"
                    size={24}
                    color={isEditEnabled ? "red" : "#0a7ea4"} // Dynamisk farve afhængigt af Edit-tilstanden
                  />
                </Pressable>
              </View>
              <View style={baseStyles.f1bottomHalf}>
                <Pressable
                  style={baseStyles.F1B}
                  onPress={handleStatusToggle} // Kalder funktionen for at skifte status
                  accessibilityLabel="Status Toggle Button"
                >
                  <AntDesign
                    name={projectData.status === "Published" ? "unlock" : "lock"} // Dynamisk ikon
                    size={24}
                    color="#0a7ea4" // Farve forbliver ens
                  />
                </Pressable>
              </View>
            </View>
          </View>
          <View style={baseStyles.f3bottomSide}>
            <Pressable
              style={baseStyles.F3}
              onPress={() => handlePress("F3")}
              onLongPress={() => handleLongPress("f3PDF")}
              accessibilityLabel="F3 Button"
            >
              {/* Vis billede, hvis det er tilgængeligt */}
              {projectData.f3CoverImageLowRes && (
                <Image
                  source={{
                    uri: `${projectData.f3CoverImageLowRes}?timestamp=${Date.now()}`, // Tilføj timestamp
                  }}
                  style={baseStyles.f3CoverImage}
                />
              )}

              {/* Tekst i F3 toppen */}
              <View style={baseStyles.textTag}>
                <Text style={baseStyles.text}>Sustainability</Text>
              </View>

              {/* Comment-knap F3 */}
              <Pressable
                style={baseStyles.commentButtonf3}
                onPress={() => handleOpenCommentModal("f3")}
              >
                <AntDesign name="message1" size={20} color="#0a7ea4" />
              </Pressable>
            </Pressable>

            {/* Ny knap for cirkulær økonomi */}
            <Pressable
              style={baseStyles.circularEconomyButton}
              onPress={() => setIsCircularModalVisible(true)} // Åbn modal
              accessibilityLabel="Circular Economy Button"
            >
              <AntDesign name="sync" size={20} color="#0a7ea4" />
            </Pressable>
          </View>
        </View>
        <View style={baseStyles.f5Side}>
          <Pressable
            style={[baseStyles.F5, { right: rightMargin }]}
            onPress={() => handlePress("F5")}
            onLongPress={() => handleLongPress("f5PDF")}
            accessibilityLabel="F5 Button"
          >
            {/* Vis billede, hvis det er tilgængeligt */}
            {projectData.f5CoverImageLowRes && (
              <Image
                source={{
                  uri: `${projectData.f5CoverImageLowRes}?timestamp=${Date.now()}`, // Tilføj timestamp
                }}
                style={baseStyles.f5CoverImage}
              />
            )}

            {/* Tekst i f5 toppen */}
            <View style={baseStyles.textTag}>
              <Text style={baseStyles.text}>Terms & Condition</Text>
            </View>

            {/* Comment-knap f5 */}
            <Pressable
              style={baseStyles.commentButtonf5}
              onPress={() => handleOpenCommentModal("f5")}
            >
              <AntDesign name="message1" size={20} color="#0a7ea4" />
            </Pressable>
          </Pressable>

          {/* Prize-knap */}
          <Pressable
            style={baseStyles.prizeTagF5}
            onPress={handlePrizePress} // Brug den nye funktion
            accessibilityLabel="Prize Button"
          >
            <AntDesign name="swap" size={20} color="#0a7ea4" />
          </Pressable>

          {/* Legal-knap placeret nederst i midten */}
          <Pressable
            style={[baseStyles.legalTagF5, { alignSelf: "center", marginTop: 10 }]} // Placer centralt og justér margin
            onPress={() => setIsLegalModalVisible(true)} // Åbn modal
            accessibilityLabel="Legal Button"
          >
            <AntDesign name="copyright" size={20} color="#0a7ea4" /> {/* Ikon for lovparagrafer */}
          </Pressable>
        </View>
      </View>

      {isLoading && (
        <View style={baseStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="blue" />
        </View>
      )}

      {/* F8 Modal */}
      <Modal
        visible={isF8ModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeF8Modal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelF8
              projectId={projectData.id} // Tilføj projectId
              userId={userId || ""} // Tilføj userId
              onClose={closeF8Modal}
            />
          </View>
        </View>
      </Modal>

      {/* F5 Modal */}
      <Modal
        visible={isF5ModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeF5Modal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelF5
              projectId={projectData.id} // Tilføj projectId
              userId={userId || ""} // Tilføj userId
              onClose={closeF5Modal}
            />
          </View>
        </View>
      </Modal>

      {/* F3 Modal */}
      <Modal
        visible={isF3ModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeF3Modal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelF3
              projectId={projectData.id} // Tilføj projectId
              userId={userId || ""} // Tilføj userId
              onClose={closeF3Modal}
            />
          </View>
        </View>
      </Modal>

      {/* F2 Modal */}
      <Modal
        visible={isF2ModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeF2Modal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelF2
              projectId={projectData.id} // Tilføj projectId
              userId={userId || ""} // Tilføj userId
              onClose={closeF2Modal}
            />
          </View>
        </View>
      </Modal>

      {/* Name & Comment Modal */}
      <Modal
        visible={isNameCommentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeNameCommentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelNameComment
              onClose={closeNameCommentModal}
              name={projectData.name || "Uden navn"}
              comment={projectData.description || "Ingen kommentar"}
              projectId={projectData.id} // Tilføj projectId hvis nødvendigt
              userId={userId || ""} // Tilføj userId hvis nødvendigt
            />
          </View>
        </View>
      </Modal>

      {/* Prize Modal */}
      <Modal
        visible={isPrizeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closePrizeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelPrize
              onClose={closePrizeModal}
              currentDescription={projectData.transferMethod || "Ingen beskrivelse tilgængelig"} // Standardbeskrivelse
              projectId={projectData.id}
              userId={userId || ""}
              onSave={updateTransferMethod} // Gem ny beskrivelse
              isEditable={isEditEnabled} // Brug toggleEdit til at styre redigering
            />
          </View>
        </View>
      </Modal>

      {/* Project Image Modal */}
      <Modal
        visible={isProjectImageModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeProjectImageModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelProjectImage
              onClose={closeProjectImageModal}
              projectId={projectData.id}
              userId={userId || ""}
              category="projectImage"
              onUploadSuccess={(downloadURL) => {
                console.log("Upload successful:", downloadURL);
                setProjectData((prev) => ({
                  ...prev,
                  projectImage: downloadURL, // Opdater med den nye URL
                }));
              }}
              onUploadFailure={(error) => {
                console.error("Fejl ved upload:", error);
                Alert.alert("Upload Fejl", "Kunne ikke uploade billede. Prøv igen.");
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal-komponenten for comments */}
      {activeCategory && (
        <Modal
          visible={isCommentModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseCommentModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <InfoPanelCommentModal
                projectId={projectData.id}
                userId={userId || ""}
                category={activeCategory} // Dette er nu sikkert
                categoryName={
                  activeCategory === "f8"
                    ? "Specification"
                    : activeCategory === "f5"
                    ? "Terms & Conditions"
                    : activeCategory === "f3"
                    ? "Sustainability Report"
                    : "Partnership Agreement"
                }
                onClose={handleCloseCommentModal}
                isEditable={isEditEnabled}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Attachment Modal */}
      <Modal
        visible={isAttachmentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAttachmentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelAttachment
              userId={userId || ""}
              projectId={projectData.id}
              onClose={closeAttachmentModal}
              isEditEnabled={isEditEnabled} // Pass isEditEnabled
            />
          </View>
        </View>
      </Modal>

      {/* Circular Economy Modal */}
      <Modal
        visible={isCircularModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCircularModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelCircular
              onClose={() => setIsCircularModalVisible(false)}
              projectId={projectData.id}
              userId={userId || ""}
              onSave={(newData: CircularEconomyData) => {
                setProjectData((prev) => ({
                  ...prev,
                  circularEconomy: newData, // Opdaterer hele circularEconomy-strukturen
                }));
              }}
              isEditable={isEditEnabled}
              currentData={projectData.circularEconomy || {
                waterUsage: { value: 0, description: "" },
                CO2Emission: { value: 0, description: "" },
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Legal Modal */}
      <Modal
        visible={isLegalModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsLegalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelLegal
              onClose={() => setIsLegalModalVisible(false)}
              currentDescription={projectData.legalDescription || "Ingen beskrivelse tilgængelig"}
              projectId={projectData.id}
              userId={userId || ""}
              onSave={(newDescription) => {
                setProjectData((prev) => ({
                  ...prev,
                  legalDescription: newDescription,
                }));
              }}
              isEditable={isEditEnabled}
            />
          </View>
        </View>
      </Modal>

      <View style={[baseStyles.separator, { backgroundColor: Colors[theme].icon }]} />
    </ScrollView>
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
    height: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
  },
  legalTagF5: { // Tilføjet stil for Legal-knap
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  chatContainer: {
    flex: 1, // Fylder hele containeren
    width: "96%", // Sætter bredden til 90% af F8-feltet
    height: "100%", // Sætter højden til 100% af F8-feltet
    justifyContent: "space-between",
    marginTop: 63, // Justerer afstanden til toppen af F8-feltet
    marginBottom: 8, // Justerer afstanden til bunden af F8-feltet
    padding: 11,
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Lys baggrund for chatten
    borderRadius: 10, // Match F8-feltets afrundede kanter, hvis det har nogen
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  chatMessages: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  chatMessage: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: "80%",
  },
  chatMessageSender: {
    alignSelf: "flex-end",
    backgroundColor: "#d4f5d4",
  },
  chatMessageReceiver: {
    alignSelf: "flex-start",
    backgroundColor: "#f5f5f5",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 13,
  },
  chatInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginRight: 10,
  },
  chatSendButton: {
    backgroundColor: "#0a7ea4",
    padding: 10,
    borderRadius: 50,
  },
});

export default InfoPanel5;