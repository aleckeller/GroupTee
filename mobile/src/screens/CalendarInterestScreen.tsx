import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Calendar } from "react-native-calendars";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import { useTeeTimes } from "@/hooks/useTeeTimes";
import { useInterests } from "@/hooks/useInterests";
import CalendarLegend from "@/components/CalendarLegend";
import GolfStats from "@/components/GolfStats";
import DayInterestModal from "@/components/DayInterestModal";
import CustomDay from "@/components/CustomDay";

export default function CalendarInterestScreen() {
  const { user } = useAuth();
  const { selectedGroup } = useGroup();
  const { teeTimes } = useTeeTimes(selectedGroup?.id || null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  const {
    interestsData,
    allInterestsData,
    markedDates,
    loading,
    loadInterests,
    loadAllInterests,
    saveInterest,
    loadInterestForDate,
    getLockoutStatus,
  } = useInterests(user, availableDates);

  // Extract available dates from tee times
  useEffect(() => {
    const dates = new Set<string>();
    teeTimes.forEach((teeTime) => {
      dates.add(teeTime.tee_date);
    });
    setAvailableDates(dates);
  }, [teeTimes]);

  // Load all interests data for stats
  useEffect(() => {
    if (user) {
      loadAllInterests();
    }
  }, [user, loadAllInterests]);

  // Load interests when available dates change
  useEffect(() => {
    if (availableDates.size > 0) {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const yearMonth = `${year}-${month}`;
      loadInterests(yearMonth);
    }
  }, [availableDates, loadInterests]);

  const onDayPress = (day: any) => {
    // Allow all enabled dates (including locked ones) to open the modal
    // The modal will handle the locked state by disabling form fields
    setSelectedDate(day.dateString);
    setShowModal(true);
  };

  const handleSaveInterest = async (dayInterest: any) => {
    if (!selectedDate) return;

    try {
      await saveInterest(selectedDate, dayInterest, () => {
        setShowModal(false);
        setSelectedDate(null);
      });
    } catch (error) {
      console.error("Error saving interest:", error);
      // Error is already handled in the modal component
    }
  };

  const onMonthChange = (month: any) => {
    // Month is already 1-based in the calendar component (1 = January, 2 = February, etc.)
    const monthString = month.month < 10 ? `0${month.month}` : month.month;
    const yearMonth = `${month.year}-${monthString}`;
    console.log(`Month changed to: ${yearMonth}`);
    loadInterests(yearMonth);
  };

  return (
    <RoleGuard allowedRoles={["member", "admin"]}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.header}>Interest Calendar</Text>
          <Text style={styles.subtitle}>
            Tap on highlighted days to set your golf preferences
          </Text>

          <Calendar
            onDayPress={onDayPress}
            markedDates={markedDates}
            onMonthChange={onMonthChange}
            disableAllTouchEventsForDisabledDays={true}
            dayComponent={CustomDay}
            theme={{
              backgroundColor: "#ffffff",
              calendarBackground: "#ffffff",
              textSectionTitleColor: "#b6c1cd",
              selectedDayBackgroundColor: "#0ea5e9",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#0ea5e9",
              dayTextColor: "#2d4150",
              textDisabledColor: "#d9e1e8",
              dotColor: "#00adf5",
              selectedDotColor: "#ffffff",
              arrowColor: "#0ea5e9",
              disabledArrowColor: "#d9e1e8",
              monthTextColor: "#2d4150",
              indicatorColor: "#0ea5e9",
              textDayFontWeight: "300",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "300",
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 13,
            }}
          />

          <CalendarLegend />

          <GolfStats
            interestsData={allInterestsData}
            availableDatesCount={availableDates.size}
          />
        </ScrollView>

        <DayInterestModal
          visible={showModal}
          selectedDate={selectedDate}
          onClose={() => {
            setShowModal(false);
            setSelectedDate(null);
          }}
          onSave={handleSaveInterest}
          loadInterestForDate={loadInterestForDate}
          loading={loading}
          lockoutStatus={selectedDate ? getLockoutStatus(selectedDate) : null}
        />
      </View>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
});
