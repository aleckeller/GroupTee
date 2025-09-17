import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { LockoutStatus } from "../types";

interface DayInterest {
  wants_to_play: boolean | null;
  time_preference: string;
  transportation: string;
  partners: string;
  notes: string;
}

interface DayInterestModalProps {
  visible: boolean;
  selectedDate: string | null;
  onClose: () => void;
  onSave: (interest: DayInterest) => Promise<void>;
  loadInterestForDate: (date: string) => Promise<any>;
  loading: boolean;
  lockoutStatus?: LockoutStatus | null;
}

const timeOptions = [
  { value: "morning", label: "Morning" },
  { value: "mid-morning", label: "Mid-Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "late-afternoon", label: "Late Afternoon" },
];

const transportationOptions = [
  { value: "walking", label: "Walking" },
  { value: "riding", label: "Riding" },
];

export default function DayInterestModal({
  visible,
  selectedDate,
  onClose,
  onSave,
  loadInterestForDate,
  loading: externalLoading,
  lockoutStatus,
}: DayInterestModalProps) {
  const [dayInterest, setDayInterest] = useState<DayInterest>({
    wants_to_play: null,
    time_preference: "morning",
    transportation: "riding",
    partners: "",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && selectedDate) {
      setIsSaving(false); // Reset loading state when modal opens
      loadInterestForDate(selectedDate).then((data) => {
        if (data) {
          setDayInterest({
            wants_to_play: data.wants_to_play,
            time_preference: data.time_preference || "morning",
            transportation: data.transportation || "riding",
            partners: data.partners || "",
            notes: data.notes || "",
          });
        } else {
          setDayInterest({
            wants_to_play: null,
            time_preference: "morning",
            transportation: "riding",
            partners: "",
            notes: "",
          });
        }
      });
    }
  }, [visible, selectedDate]);

  const handleSave = async () => {
    if (lockoutStatus?.isLocked) {
      Alert.alert(
        "Preferences Locked",
        lockoutStatus.message || "Preferences are locked for this date."
      );
      return;
    }

    if (dayInterest.wants_to_play === null) {
      Alert.alert("Please select", "Do you want to play golf on this day?");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(dayInterest);
      // Don't reset form state here - let the parent handle it
    } catch (error) {
      // Error is already handled by the parent component
      console.error("Error in modal handleSave:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>
              {selectedDate ? formatDate(selectedDate) : "Select Date"}
            </Text>

            {/* Lockout Status Display */}
            {lockoutStatus && lockoutStatus.message && (
              <View
                style={[
                  styles.lockoutContainer,
                  lockoutStatus.isLocked && styles.lockoutContainerLocked,
                  lockoutStatus.isApproachingLockout &&
                    !lockoutStatus.isLocked &&
                    styles.lockoutContainerWarning,
                ]}
              >
                <Text
                  style={[
                    styles.lockoutText,
                    lockoutStatus.isLocked && styles.lockoutTextLocked,
                    lockoutStatus.isApproachingLockout &&
                      !lockoutStatus.isLocked &&
                      styles.lockoutTextWarning,
                  ]}
                >
                  {lockoutStatus.message}
                </Text>
              </View>
            )}

            {/* Step 1: Do you want to play? */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Do you want to play golf on this day?
              </Text>
              <View style={styles.choiceContainer}>
                <Pressable
                  style={[
                    styles.choiceButton,
                    dayInterest.wants_to_play === true &&
                      styles.choiceButtonSelected,
                    lockoutStatus?.isLocked &&
                      dayInterest.wants_to_play !== true &&
                      styles.choiceButtonDisabled,
                  ]}
                  onPress={() =>
                    !lockoutStatus?.isLocked &&
                    setDayInterest({ ...dayInterest, wants_to_play: true })
                  }
                  disabled={lockoutStatus?.isLocked}
                >
                  <Text
                    style={[
                      styles.choiceButtonText,
                      dayInterest.wants_to_play === true &&
                        styles.choiceButtonTextSelected,
                      lockoutStatus?.isLocked &&
                        dayInterest.wants_to_play !== true &&
                        styles.choiceButtonTextDisabled,
                    ]}
                  >
                    Yes, I want to play
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.choiceButton,
                    dayInterest.wants_to_play === false &&
                      styles.choiceButtonSelected,
                    lockoutStatus?.isLocked &&
                      dayInterest.wants_to_play !== false &&
                      styles.choiceButtonDisabled,
                  ]}
                  onPress={() =>
                    !lockoutStatus?.isLocked &&
                    setDayInterest({ ...dayInterest, wants_to_play: false })
                  }
                  disabled={lockoutStatus?.isLocked}
                >
                  <Text
                    style={[
                      styles.choiceButtonText,
                      dayInterest.wants_to_play === false &&
                        styles.choiceButtonTextSelected,
                      lockoutStatus?.isLocked &&
                        dayInterest.wants_to_play !== false &&
                        styles.choiceButtonTextDisabled,
                    ]}
                  >
                    No, I can't play
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Step 2: Additional details (only show if wants to play) */}
            {dayInterest.wants_to_play === true && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Time Preference</Text>
                  <View style={styles.radioContainer}>
                    {timeOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.radioOption,
                          lockoutStatus?.isLocked &&
                            dayInterest.time_preference !== option.value &&
                            styles.radioOptionDisabled,
                        ]}
                        onPress={() =>
                          !lockoutStatus?.isLocked &&
                          setDayInterest({
                            ...dayInterest,
                            time_preference: option.value,
                          })
                        }
                        disabled={lockoutStatus?.isLocked}
                      >
                        <View
                          style={[
                            styles.radioButton,
                            lockoutStatus?.isLocked &&
                              dayInterest.time_preference !== option.value &&
                              styles.radioButtonDisabled,
                          ]}
                        >
                          {dayInterest.time_preference === option.value && (
                            <View style={styles.radioSelected} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.radioLabel,
                            lockoutStatus?.isLocked &&
                              dayInterest.time_preference !== option.value &&
                              styles.radioLabelDisabled,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Transportation</Text>
                  <View style={styles.radioContainer}>
                    {transportationOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.radioOption,
                          lockoutStatus?.isLocked &&
                            dayInterest.transportation !== option.value &&
                            styles.radioOptionDisabled,
                        ]}
                        onPress={() =>
                          !lockoutStatus?.isLocked &&
                          setDayInterest({
                            ...dayInterest,
                            transportation: option.value,
                          })
                        }
                        disabled={lockoutStatus?.isLocked}
                      >
                        <View
                          style={[
                            styles.radioButton,
                            lockoutStatus?.isLocked &&
                              dayInterest.transportation !== option.value &&
                              styles.radioButtonDisabled,
                          ]}
                        >
                          {dayInterest.transportation === option.value && (
                            <View style={styles.radioSelected} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.radioLabel,
                            lockoutStatus?.isLocked &&
                              dayInterest.transportation !== option.value &&
                              styles.radioLabelDisabled,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Preferred Partners</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      lockoutStatus?.isLocked && styles.textInputDisabled,
                    ]}
                    value={dayInterest.partners}
                    onChangeText={(text) =>
                      !lockoutStatus?.isLocked &&
                      setDayInterest({ ...dayInterest, partners: text })
                    }
                    placeholder="Names (optional)"
                    editable={!lockoutStatus?.isLocked}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Notes</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.textArea,
                      lockoutStatus?.isLocked && styles.textInputDisabled,
                    ]}
                    value={dayInterest.notes}
                    onChangeText={(text) =>
                      !lockoutStatus?.isLocked &&
                      setDayInterest({ ...dayInterest, notes: text })
                    }
                    placeholder="Any additional notes..."
                    multiline
                    numberOfLines={3}
                    editable={!lockoutStatus?.isLocked}
                  />
                </View>
              </>
            )}

            <View style={styles.buttonContainer}>
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.saveButton,
                  (isSaving || lockoutStatus?.isLocked) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={isSaving || lockoutStatus?.isLocked}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving
                    ? "Saving..."
                    : lockoutStatus?.isLocked
                    ? "Locked"
                    : "Save"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 20,
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  choiceContainer: {
    gap: 12,
  },
  choiceButton: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  choiceButtonSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#0ea5e9",
  },
  choiceButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
  choiceButtonTextSelected: {
    color: "#0ea5e9",
    fontWeight: "600",
  },
  radioContainer: {
    gap: 12,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0ea5e9",
  },
  radioLabel: {
    fontSize: 16,
    color: "#374151",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#0ea5e9",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  // Lockout styles
  lockoutContainer: {
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  lockoutContainerLocked: {
    backgroundColor: "#f3f4f6",
    borderColor: "#9ca3af",
  },
  lockoutContainerWarning: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },
  lockoutText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#f59e0b",
    textAlign: "center",
  },
  lockoutTextLocked: {
    color: "#9ca3af",
  },
  lockoutTextWarning: {
    color: "#f59e0b",
  },
  // Disabled form styles
  choiceButtonDisabled: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
  },
  choiceButtonTextDisabled: {
    color: "#9ca3af",
  },
  radioOptionDisabled: {
    opacity: 0.6,
  },
  radioButtonDisabled: {
    borderColor: "#d1d5db",
  },
  radioLabelDisabled: {
    color: "#9ca3af",
  },
  textInputDisabled: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
    color: "#9ca3af",
  },
});
