// @/app/screens/Admin.tsx

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Alert,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
} from "react-native";
import { database } from "@/firebaseConfig"; // Import your Firebase configuration
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore"; // Import Firestore functions
import { useAuth } from "@/hooks/useAuth"; // Import your auth hook
import FontAwesome from "@expo/vector-icons/FontAwesome"; // Import icons
import MaterialIcons from "@expo/vector-icons/MaterialIcons"; // Import Material Icons
import moment from "moment"; // Import moment.js for date formatting
import "moment/locale/da";

// Define a type for user data
interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  nickname: string;
  profileImage: string;
  location: string;
  createdAt: string; // Store as ISO string
  lastUsed: string; // Store as ISO string
}

const AdminScreen = () => {
  const { userRole } = useAuth(); // Fetch user role from the auth hook

  // Check if the user is admin
  if (userRole !== "Admin") {
    return (
      <View style={styles.container}>
        <Text style={styles.accessDenied}>Access Denied</Text>
      </View>
    );
  }

  const [users, setUsers] = useState<User[]>([]); // Define user type
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [modalVisible, setModalVisible] = useState(false); // New state for modal visibility
  const [editModalVisible, setEditModalVisible] = useState(false); // State for edit modal visibility
  const [selectedUser, setSelectedUser] = useState<string | null>(null); // The user selected for role change
  const [newRole, setNewRole] = useState<string>(""); // The new role being selected
  const [editUserData, setEditUserData] = useState<User | null>(null); // Data for editing

  const fetchUsers = async () => {
    const usersCollection = collection(database, "users");
    const userDocs = await getDocs(usersCollection);
    const userList: User[] = userDocs.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[]; // Typecasting to User[]
    setUsers(userList);
  };

  useEffect(() => {
    fetchUsers(); // Fetch users on first render
  }, []);

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      await setDoc(
        doc(database, "users", userId),
        { role: newRole },
        { merge: true }
      );
      Alert.alert("Success", `User role has been changed to ${newRole}.`);
      fetchUsers(); // Update user list
    } catch (error) {
      console.error("Error updating user role: ", error);
    }
  };

  const confirmRoleChange = (userId: string, role: string) => {
    setSelectedUser(userId);
    setNewRole(role);
    const message =
      role === "Admin"
        ? "Are you sure you want to assign this user the Admin role? This gives them full access to the system."
        : "Are you sure you want to change this user's role?";

    Alert.alert(
      "Confirm Role Change",
      message,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: () => {
            setModalVisible(true); // Show modal for confirmation
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleConfirm = () => {
    if (selectedUser && newRole) {
      handleChangeUserRole(selectedUser, newRole);
      setModalVisible(false); // Hide modal
      setSelectedUser(null); // Reset selected user
      setNewRole(""); // Reset new role
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesEmail = user.email
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "All" || user.role === filterRole;
    return matchesEmail && matchesRole;
  });

  // Funktion til at formatere sidste brugt
  const formatLastUsed = (lastUsed: string) => {
    const lastUsedDate = new Date(lastUsed);

    if (isNaN(lastUsedDate.getTime())) {
      return "Dato ikke tilgængelig";
    }

    const now = moment();
    const duration = moment.duration(now.diff(lastUsedDate));
    const days = Math.floor(duration.asDays());
    const hours = Math.floor(duration.asHours() % 24);

    return `${days} dage og ${hours} timer siden`;
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Slet brugerens dokument fra Firestore
      await deleteDoc(doc(database, "users", userId));
      Alert.alert("Succes”, “Brugeren er blevet slettet.");
      fetchUsers(); // Opdater brugerlisten
    } catch (error) {
      console.error("Fejl ved sletning af bruger: ", error);
      Alert.alert("Fejl", "Kunne ikke slette brugeren.");
    }
  };

  const confirmDeleteUser = (userId: string) => {
    Alert.alert(
      "Sletning bekræftet",
      "Ønsker du virkelig at slette denne bruger? Denne handling kan ikke fortrydes.",
      [
        {
          text: "Fortryd",
          style: "cancel",
        },
        {
          text: "Bekræft sletning",
          onPress: () => handleDeleteUser(userId),
        },
      ],
      { cancelable: false }
    );
  };

  // Funktion til at åbne redigeringsmodalen
  const openEditModal = (user: User) => {
    setEditUserData(user);
    setEditModalVisible(true);
  };

  // Funktion til at gemme redigerede brugerdata
  const saveUserData = async () => {
    if (editUserData) {
      try {
        await setDoc(doc(database, "users", editUserData.id), editUserData, {
          merge: true,
        });
        Alert.alert("Succes", "Brugerdata er opdateret.");
        fetchUsers();
        setEditModalVisible(false);
        setEditUserData(null);
      } catch (error) {
        console.error("Fejl ved opdatering af brugerdata: ", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Søgefelt */}
      <TextInput
        style={styles.searchInput}
        placeholder="Søg efter bruger..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Rolle Filter */}
      <View style={styles.roleFilterContainer}>
        {["All", "User", "Designer", "Admin"].map((role) => (
          <TouchableOpacity key={role} onPress={() => setFilterRole(role)}>
            {role === "All" ? (
              <MaterialIcons
                name="visibility"
                size={20}
                color={filterRole === role ? "#007AFF" : "#555"}
              />
            ) : (
              <FontAwesome
                name={
                  role === "User"
                    ? "user"
                    : role === "Designer"
                    ? "scissors"
                    : "star"
                }
                size={20}
                color={filterRole === role ? "#007AFF" : "#555"}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <Image
              source={{ uri: item.profileImage }}
              style={styles.profileImage}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userText}>
                {item.name} ({item.nickname})
              </Text>
              <Text style={styles.userDetails}>Rolle: {item.role}</Text>
              <Text style={styles.userDetails}>Email: {item.email}</Text>
              <Text style={styles.userDetails}>Adresse: {item.location}</Text>
              <Text style={styles.userDetails}>
                Indskrevet: {moment(item.createdAt).locale("da").format("LLLL")}
              </Text>
              <Text style={styles.userDetails}>
                Sidst anvendt: {formatLastUsed(item.lastUsed)}
              </Text>
            </View>

            {/* Cirkulær slet knap */}
            <TouchableOpacity
              onPress={() => confirmDeleteUser(item.id)}
              style={styles.deleteButton}
            >
              <MaterialIcons name="delete" size={24} color="#FF0000" />
            </TouchableOpacity>

            {/* Cirkulær edit knap */}
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              style={styles.editButton}
            >
              <MaterialIcons name="edit" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
      />

      {/* Modal for at bekræfte rolleændring */}
      <Modal transparent={true} visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bekræft rolleændring</Text>
            <Text style={styles.modalMessage}>
              Er du sikker på, at du vil ændre denne brugers rolle til {newRole}
              ?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={handleConfirm}
                style={styles.confirmButton}
              >
                {/* <Text style={styles.buttonText}>Bekræft</Text> */}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelButton}
              >
                {/* <Text style={styles.buttonText}>Annuller</Text> */}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        transparent={true}
        visible={editModalVisible}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rediger Bruger</Text>
            {editUserData && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Navn"
                  value={editUserData.name}
                  onChangeText={(text) =>
                    setEditUserData({ ...editUserData, name: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Kaldenavn"
                  value={editUserData.nickname}
                  onChangeText={(text) =>
                    setEditUserData({ ...editUserData, nickname: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={editUserData.email}
                  onChangeText={(text) =>
                    setEditUserData({ ...editUserData, email: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Adresse"
                  value={editUserData.location}
                  onChangeText={(text) =>
                    setEditUserData({ ...editUserData, location: text })
                  }
                />
                {/* Picker for selecting role */}
                <View style={styles.rolePickerContainer}>
                  <Text style={styles.rolePickerLabel}>Rolle:</Text>
                  <View style={styles.roleButtons}>
                    {["User", "Designer", "Admin"].map((role) => (
                      <TouchableOpacity
                        key={role}
                        onPress={() => {
                          setEditUserData({
                            ...editUserData,
                            role: role,
                          });
                        }}
                        style={[
                          styles.roleButton,
                          editUserData.role === role && styles.activeRoleButton,
                        ]}
                      >
                        {role === "User" && (
                          <FontAwesome name="user" size={20} color="#333" />
                        )}
                        {role === "Designer" && (
                          <FontAwesome name="scissors" size={20} color="#333" />
                        )}
                        {role === "Admin" && (
                          <FontAwesome name="star" size={20} color="#333" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={saveUserData}
                  style={styles.confirmButton}
                >
                  <Text style={styles.buttonText}>Gem</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.buttonText}>Annuller</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3, // For Android
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25, // Circular profile image
    marginRight: 15,
  },
  userInfo: {
    flex: 1, // To fill remaining space
    justifyContent: "center",
    paddingTop: 10,
  },
  userText: {
    fontSize: 16,
    color: "#555",
  },
  userDetails: {
    fontSize: 14,
    color: "#777",
  },
  deleteButton: {
    position: "absolute",
    top: 15, // Juster denne værdi for at flytte knappen op/ned
    right: 15, // Juster denne værdi for at flytte knappen til venstre/højre
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Baggrundsfarve for knappen
    borderRadius: 25, // For at gøre knappen cirkulær
    padding: 12,
    elevation: 2, // Skygge for bedre visuel effekt
    borderWidth: 1,
    borderColor: "#ccc",
  },
  editButton: {
    position: "absolute",
    top: 15, // Juster denne værdi for at flytte knappen op/ned
    right: 150, // Juster denne værdi for at placere knappen til venstre/højre for delete-knappen
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Baggrundsfarve for knappen
    borderRadius: 25, // For at gøre knappen cirkulær
    padding: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingLeft: 8,
    width: "100%", // Full width for the input
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingLeft: 8,
  },
  roleFilterContainer: {
    flexDirection: "row",
    justifyContent: "space-around", // Justér for bedre kompakthed
    marginBottom: 10,
  },
  rolePickerContainer: {
    marginBottom: 10,
    width: "100%",
    //borderWidth: 1,
  },
  rolePickerLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  roleButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    //padding: 5,
    //marginVertical: 5,
  },
  roleButton: {
    //backgroundColor: "#f0f0f0",
    padding: 16,
    borderRadius: 30,
    //width: 50,
  },
  activeRoleButton: {
    backgroundColor: "#007AFF", // Highlight active button
  },
  roleButtonText: {
    color: "#333",
  },
  accessDenied: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 50,
  },
  listContainer: {
    paddingBottom: 100,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Sort baggrund med gennemsigtighed
  },
  modalContent: {
    width: "80%",
    height: 450, // her styres højden af modal
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    //borderWidth: 1,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    alignItems: "center", // Centrer knapperne vertikalt
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#007AFF", // Blå baggrund
    borderRadius: 30,
    padding: 10,
    marginRight: 5,
    alignItems: "center",
    //borderWidth: 1,
    //borderColor: "red",
  },
  cancelButton: {
    flex: 1,
    //backgroundColor: "#ccc", // Lys grå baggrund
    borderRadius: 30,
    padding: 10,
    marginTop: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  buttonText: {
    color: "black", // Behold hvid for confirmButton
    fontSize: 16,
    //borderWidth: 1,
  },
});

export default AdminScreen;
