import React, { useEffect, useRef, useState } from "react";

import {
  Alert,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import * as Location from "expo-location";
import * as Contacts from "expo-contacts";

const EMERGENCY_TYPES = [
  {
    id: "police",
    icon: "👮",
    title: "Police Help"
  },
  {
    id: "medical",
    icon: "🚑",
    title: "Medical Emergency"
  },
  {
    id: "fire",
    icon: "🔥",
    title: "Fire Emergency"
  },
  {
    id: "women",
    icon: "👩",
    title: "Women Safety"
  },
  {
    id: "child",
    icon: "🧒",
    title: "Child Protection"
  },
  {
    id: "accident",
    icon: "🚗",
    title: "Road Accident"
  },
  {
    id: "other",
    icon: "❓",
    title: "Other Emergency"
  }
];

const INITIAL_CONTACTS = [
  {
    id: "default-1",
    name: "My Mother",
    phone: "+919812345678",
    relation: "Parent"
  }
];

export default function App() {
  const [userName] = useState("SafeZone User");

  const [contacts, setContacts] =
    useState(INITIAL_CONTACTS);

  const [location, setLocation] =
    useState(null);

  const [status, setStatus] =
    useState("Ready");

  const [active, setActive] =
    useState(false);

  const [showTypes, setShowTypes] =
    useState(false);

  const [selectedType, setSelectedType] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [newName, setNewName] =
    useState("");

  const [newPhone, setNewPhone] =
    useState("");

  const [newRelation, setNewRelation] =
    useState("");

  const watcherRef = useRef(null);

  useEffect(() => {
    return () => {
      if (watcherRef.current) {
        watcherRef.current.remove();
        watcherRef.current = null;
      }
    };
  }, []);

  function cleanPhone(phone = "") {
    return phone.replace(/[^d]/g, "");
  }

  async function startEmergency(type) {
    if (active) {
      Alert.alert(
        "Emergency already active",
        "Stop the current emergency before starting another."
      );
      return;
    }

    setSelectedType(type);
    setShowTypes(false);
    setStatus("Requesting GPS location...");

    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setStatus("Location permission denied");

        Alert.alert(
          "Location required",
          "Please allow location permission for SafeZone."
        );

        return;
      }

      const result =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

      const firstLocation = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy || 0,
        time: new Date().toISOString()
      };

      setLocation(firstLocation);
      setActive(true);
      setStatus("Emergency active");

      Alert.alert(
        "Emergency started",
        `${type.title} selected. Your location is ready to share.`
      );

      const newWatcher =
        await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 15000,
            distanceInterval: 10
          },
          (newResult) => {
            const updatedLocation = {
              latitude: newResult.coords.latitude,
              longitude: newResult.coords.longitude,
              accuracy: newResult.coords.accuracy || 0,
              time: new Date().toISOString()
            };

            setLocation(updatedLocation);

            setStatus(
              "Location updated at " +
                new Date().toLocaleTimeString()
            );
          }
        );

      watcherRef.current = newWatcher;
    } catch (error) {
      console.log(error);

      setStatus("Could not get location");

      Alert.alert(
        "Location error",
        "Unable to get your location. Please check that GPS is enabled."
      );
    }
  }

  function stopEmergency() {
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }

    setActive(false);
    setStatus("Location sharing stopped");

    Alert.alert(
      "Emergency stopped",
      "Live location sharing has stopped."
    );
  }

  function createMessage() {
    if (!location) {
      return "I need help. My location is unavailable.";
    }

    const typeName =
      selectedType?.title || "Emergency";

    const mapLink =
      `https://maps.google.com/?q=${location.latitude},${location.longitude}`;

    const time =
      new Date(location.time).toLocaleString();

    return (
      `🚨 ${typeName.toUpperCase()} from ${userName}. ` +
      `I need help. My location: ${mapLink}. ` +
      `Time: ${time}. ` +
      `Please call me or come to my location.`
    );
  }

  async function sendWhatsApp(contact) {
    if (!location || !selectedType) {
      Alert.alert(
        "Start emergency first",
        "Choose an emergency type and start the emergency."
      );
      return;
    }

    const phone =
      cleanPhone(contact.phone);

    const message =
      encodeURIComponent(createMessage());

    const url =
      `https://wa.me/${phone}?text=${message}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        "WhatsApp error",
        "Unable to open WhatsApp."
      );
    }
  }

  async function sendSms(contact) {
    if (!location || !selectedType) {
      Alert.alert(
        "Start emergency first",
        "Choose an emergency type and start the emergency."
      );
      return;
    }

    const phone =
      contact.phone.replace(/[^d+]/g, "");

    const message =
      encodeURIComponent(createMessage());

    const separator =
      Platform.OS === "ios" ? "&" : "?";

    const url =
      `sms:${phone}${separator}body=${message}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        "SMS error",
        "Unable to open the messaging application."
      );
    }
  }

  function call112() {
    Alert.alert(
      "Call emergency services?",
      "This will open the phone dialer for emergency number 112.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Open Dialer",
          onPress: () =>
            Linking.openURL("tel:112")
        }
      ]
    );
  }

  function openMap() {
    if (!location) {
      Alert.alert(
        "Location unavailable",
        "Start an emergency first."
      );
      return;
    }

    Linking.openURL(
      `https://maps.google.com/?q=${location.latitude},${location.longitude}`
    );
  }

  function addContact() {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert(
        "Missing details",
        "Enter the contact name and phone number."
      );
      return;
    }

    const cleanedPhone =
      newPhone.trim().replace(/[^d+]/g, "");

    if (cleanPhone(cleanedPhone).length < 10) {
      Alert.alert(
        "Invalid phone number",
        "Enter a valid phone number with country code."
      );
      return;
    }

    const phoneAlreadyExists =
      contacts.some(
        (contact) =>
          cleanPhone(contact.phone) ===
          cleanPhone(cleanedPhone)
      );

    if (phoneAlreadyExists) {
      Alert.alert(
        "Contact already exists",
        "This phone number is already saved."
      );
      return;
    }

    const newContact = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: cleanedPhone,
      relation:
        newRelation.trim() || "Emergency contact"
    };

    setContacts((currentContacts) => [
      ...currentContacts,
      newContact
    ]);

    setNewName("");
    setNewPhone("");
    setNewRelation("");
    setShowForm(false);

    Alert.alert(
      "Contact added",
      `${newContact.name} was added.`
    );
  }

  async function importPhoneContacts() {
    try {
      const permission =
        await Contacts.requestPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Permission denied",
          "SafeZone needs permission to read your phone contacts."
        );
        return;
      }

      const result =
        await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers]
        });

      const importedContacts =
        result.data
          .filter(
            (contact) =>
              contact.name &&
              contact.phoneNumbers &&
              contact.phoneNumbers.length > 0
          )
          .map((contact, index) => {
            const phoneNumber =
              contact.phoneNumbers[0].number;

            return {
              id:
                `phone-${contact.id || index}`,
              name: contact.name,
              phone: phoneNumber,
              relation: "Phone contact"
            };
          });

      if (importedContacts.length === 0) {
        Alert.alert(
          "No contacts found",
          "No contacts with phone numbers were found."
        );
        return;
      }

      let addedCount = 0;

      setContacts((currentContacts) => {
        const existingNumbers =
          new Set(
            currentContacts.map((contact) =>
              cleanPhone(contact.phone)
            )
          );

        const newContacts =
          importedContacts.filter((contact) => {
            const number =
              cleanPhone(contact.phone);

            if (existingNumbers.has(number)) {
              return false;
            }

            existingNumbers.add(number);
            addedCount += 1;

            return true;
          });

        return [
          ...currentContacts,
          ...newContacts
        ];
      });

      Alert.alert(
        "Contacts imported",
        `${addedCount} new contacts were added.`
      );
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Import failed",
        "Unable to import contacts from your phone."
      );
    }
  }

  function deleteContact(id) {
    Alert.alert(
      "Delete contact?",
      "Are you sure you want to delete this contact?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setContacts((currentContacts) =>
              currentContacts.filter(
                (contact) =>
                  contact.id !== id
              )
            );
          }
        }
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require(
              "./assets/safezone-logo.png"
            )}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <Text style={styles.logo}>
            SafeZone
          </Text>

          <Text style={styles.subtitle}>
            Emergency support for students
          </Text>
        </View>

        <View style={styles.privacyBox}>
          <Text style={styles.privacyTitle}>
            Privacy protection
          </Text>

          <Text style={styles.privacyText}>
            Location sharing starts only after you press Emergency.
          </Text>
        </View>

        {!active ? (
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={() =>
              setShowTypes(!showTypes)
            }
            activeOpacity={0.85}
          >
            <Text style={styles.emergencyIcon}>
              🚨
            </Text>

            <Text style={styles.emergencyText}>
              EMERGENCY
            </Text>

            <Text style={styles.emergencySubtext}>
              Select the emergency type
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopEmergency}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              STOP LIVE LOCATION
            </Text>
          </TouchableOpacity>
        )}

        {showTypes && (
          <View style={styles.typeBox}>
            <Text style={styles.typeTitle}>
              What type of emergency?
            </Text>

            {EMERGENCY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.typeButton}
                onPress={() =>
                  startEmergency(type)
                }
                activeOpacity={0.8}
              >
                <Text style={styles.typeIcon}>
                  {type.icon}
                </Text>

                <Text style={styles.typeText}>
                  {type.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.status}>
          {status}
        </Text>

        {selectedType && (
          <View style={styles.selectedBox}>
            <Text style={styles.selectedText}>
              Selected: {selectedType.icon}{" "}
              {selectedType.title}
            </Text>
          </View>
        )}

        {location && (
          <View style={styles.locationBox}>
            <Text style={styles.locationTitle}>
              Live location
            </Text>

            <Text style={styles.locationText}>
              Latitude:{" "}
              {location.latitude.toFixed(6)}
            </Text>

            <Text style={styles.locationText}>
              Longitude:{" "}
              {location.longitude.toFixed(6)}
            </Text>

            <Text style={styles.locationText}>
              Accuracy:{" "}
              {Math.round(location.accuracy)}
              {" "}metres
            </Text>

            <Text style={styles.locationText}>
              Updated:{" "}
              {new Date(
                location.time
              ).toLocaleTimeString()}
            </Text>

            <TouchableOpacity
              style={styles.mapButton}
              onPress={openMap}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>
                Open in Google Maps
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.policeButton}
          onPress={call112}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            📞 Call Police / Emergency 112
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            setShowForm(!showForm)
          }
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {showForm
              ? "Close Contact Form"
              : "＋ Add New Emergency Contact"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.importButton}
          onPress={importPhoneContacts}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            📱 Import Contacts from Phone
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.formBox}>
            <Text style={styles.formTitle}>
              Add new contact
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Contact name"
              placeholderTextColor="#94a3b8"
              value={newName}
              onChangeText={setNewName}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone: +919812345678"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />

            <TextInput
              style={styles.input}
              placeholder="Relation: Parent or Friend"
              placeholderTextColor="#94a3b8"
              value={newRelation}
              onChangeText={setNewRelation}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={addContact}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>
                Save Contact
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.contactsTitle}>
          Trusted contacts
        </Text>

        {contacts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No emergency contacts added yet.
            </Text>
          </View>
        ) : (
          contacts.map((contact) => (
            <View
              key={contact.id}
              style={styles.contactCard}
            >
              <Text style={styles.contactName}>
                {contact.name}
              </Text>

              <Text style={styles.contactDetails}>
                {contact.phone} • {contact.relation}
              </Text>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={() =>
                    sendWhatsApp(contact)
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.buttonText}>
                    WhatsApp
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smsButton}
                  onPress={() =>
                    sendSms(contact)
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.buttonText}>
                    SMS
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() =>
                  deleteContact(contact.id)
                }
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>
                  Delete Contact
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={styles.footerText}>
          SafeZone is a prototype. In a real emergency, call 112.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },

  header: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20
  },

  logoImage: {
    width: 95,
    height: 95,
    marginBottom: 8
  },

  logo: {
    fontSize: 38,
    fontWeight: "900",
    color: "#be123c",
    letterSpacing: 0.5
  },

  subtitle: {
    color: "#64748b",
    fontSize: 15,
    marginTop: 4
  },

  privacyBox: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20
  },

  privacyTitle: {
    color: "#1d4ed8",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6
  },

  privacyText: {
    color: "#1e40af",
    fontSize: 14,
    lineHeight: 21
  },

  emergencyButton: {
    backgroundColor: "#e11d48",
    height: 190,
    borderRadius: 32,
    marginHorizontal: 20,
    marginBottom: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10
  },

  emergencyIcon: {
    fontSize: 55,
    marginBottom: 8
  },

  emergencyText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1
  },

  emergencySubtext: {
    color: "#ffe4e6",
    fontSize: 14,
    marginTop: 8
  },

  stopButton: {
    backgroundColor: "#334155",
    borderRadius: 16,
    paddingVertical: 18,
    marginHorizontal: 20,
    marginBottom: 18,
    alignItems: "center"
  },

  typeBox: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 18,
    elevation: 4
  },

  typeTitle: {
    color: "#0f172a",
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 14
  },

  typeButton: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9
  },

  typeIcon: {
    fontSize: 26,
    marginRight: 12
  },

  typeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700"
  },

  status: {
    color: "#475569",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 15
  },

  selectedBox: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 16
  },

  selectedText: {
    color: "#9f1239",
    fontSize: 16,
    fontWeight: "800"
  },

  locationBox: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 16
  },

  locationTitle: {
    color: "#15803d",
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 12
  },

  locationText: {
    color: "#166534",
    fontSize: 15,
    marginBottom: 6
  },

  mapButton: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12
  },

  policeButton: {
    backgroundColor: "#f97316",
    borderRadius: 16,
    paddingVertical: 17,
    marginHorizontal: 20,
    marginBottom: 12,
    alignItems: "center",
    elevation: 4
  },

  addButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 16,
    paddingVertical: 17,
    marginHorizontal: 20,
    marginBottom: 12,
    alignItems: "center"
  },

  importButton: {
    backgroundColor: "#0891b2",
    borderRadius: 16,
    paddingVertical: 17,
    marginHorizontal: 20,
    marginBottom: 18,
    alignItems: "center"
  },

  formBox: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 4
  },

  formTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14
  },

  input: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 12,
    color: "#0f172a"
  },

  saveButton: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center"
  },

  contactsTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
    marginHorizontal: 20,
    marginBottom: 12
  },

  contactCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 17,
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 3
  },

  contactName: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800"
  },

  contactDetails: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 5,
    marginBottom: 14
  },

  row: {
    flexDirection: "row",
    width: "100%",
    gap: 8,
    marginBottom: 8
  },

  whatsappButton: {
    flex: 1,
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },

  smsButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },

  deleteButton: {
    width: "100%",
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },

  emptyBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center"
  },

  emptyText: {
    color: "#64748b",
    fontSize: 15
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center"
  },

  footerText: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 19
  }
});