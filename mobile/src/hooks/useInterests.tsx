import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import {
  isDateLocked,
  isDateApproachingLockout,
  getDaysUntilLockout,
  getLockoutStatusMessage,
} from "../utils/lockoutConfig";
import { LockoutStatus } from "../types";

interface DayInterest {
  wants_to_play: boolean | null;
  time_preference: string;
  transportation: string;
  partners: string[]; // Array of member IDs in component
  guest_count: number;
  notes: string;
}

interface Interest {
  id: string;
  user_id: string;
  interest_date: string;
  wants_to_play: boolean | null;
  time_preference: string | null;
  transportation: string | null;
  partners: string | null;
  guest_count: number | null;
  notes: string | null;
}

export function useInterests(user: User | null, availableDates: Set<string>) {
  const [interestsData, setInterestsData] = useState<Interest[]>([]);
  const [allInterestsData, setAllInterestsData] = useState<Interest[]>([]);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const loadAllInterests = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("interests")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      setAllInterestsData(data || []);
    } catch (error) {
      console.error("Error loading all interests:", error);
    }
  }, [user]);

  const loadInterests = useCallback(
    async (month: string) => {
      if (!user) return;

      setLoading(true);
      try {
        const [year, monthNum] = month.split("-").map(Number);
        const startDate = `${year}-${monthNum.toString().padStart(2, "0")}-01`;
        const endDate = `${year}-${monthNum
          .toString()
          .padStart(2, "0")}-${new Date(year, monthNum, 0).getDate()}`;

        const { data, error } = await supabase
          .from("interests")
          .select("*")
          .eq("user_id", user.id)
          .gte("interest_date", startDate)
          .lte("interest_date", endDate);

        if (error) throw error;

        setInterestsData(data || []);

        const marked: Record<string, any> = {};

        // Get all days in the current month
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        const currentMonthPrefix = `${year}-${monthNum
          .toString()
          .padStart(2, "0")}`;

        // Mark all days in the current month - enable only those with tee times
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${monthNum.toString().padStart(2, "0")}-${day
            .toString()
            .padStart(2, "0")}`;

          if (availableDates.has(dateStr)) {
            // Date has tee times - enable it
            marked[dateStr] = {
              disabled: false,
              disableTouchEvent: false,
              marked: true,
              dotColor: "#0ea5e9",
              selectedColor: "#0ea5e9",
            };
          } else {
            // Date has no tee times - disable it
            marked[dateStr] = {
              disabled: true,
              disableTouchEvent: true,
              textColor: "#d9e1e8",
            };
          }
        }

        // Create a set of dates that have interests
        const datesWithInterests = new Set(
          data?.map((interest) => interest.interest_date) || []
        );

        // Apply interest data and highlight dates that need action
        data?.forEach((interest) => {
          const dateStr = interest.interest_date;
          // Process interests for all dates that are in markedDates
          if (marked[dateStr]) {
            const lockoutStatus = getLockoutStatus(dateStr);

            if (interest.wants_to_play === true) {
              marked[dateStr] = {
                ...marked[dateStr],
                marked: true,
                dotColor: "#10b981", // Green for playing
                selectedColor: "#10b981",
                // Add lockout styling
                ...(lockoutStatus.isLocked && {
                  textColor: "#9ca3af",
                  selectedColor: "#9ca3af",
                  locked: true,
                }),
              };
            } else if (interest.wants_to_play === false) {
              marked[dateStr] = {
                ...marked[dateStr],
                marked: true,
                dotColor: "#ef4444",
                selectedColor: "#ef4444",
                // Add lockout styling
                ...(lockoutStatus.isLocked && {
                  textColor: "#9ca3af",
                  selectedColor: "#9ca3af",
                  locked: true,
                }),
              };
            }
          }
        });

        // Highlight dates that need action (available but no interest set)
        availableDates.forEach((date) => {
          // Highlight dates that are available but have no interest set
          if (marked[date] && !datesWithInterests.has(date)) {
            const lockoutStatus = getLockoutStatus(date);

            marked[date] = {
              ...marked[date],
              marked: false, // Don't show any dot for action needed dates
              selected: true, // Highlight the entire day
              selectedColor: lockoutStatus.isLocked ? "#f3f4f6" : "#fef3c7", // Gray for locked, yellow for available
              selectedTextColor: lockoutStatus.isLocked ? "#9ca3af" : undefined, // Gray for locked, default black for available
              locked: lockoutStatus.isLocked,
            };
          }
        });

        setMarkedDates(marked);
      } catch (error) {
        console.error("Error loading interests:", error);
      } finally {
        setLoading(false);
      }
    },
    [user, availableDates]
  );

  const saveInterest = async (
    selectedDate: string,
    dayInterest: DayInterest,
    onSuccess: () => void
  ) => {
    if (!user || !selectedDate) return;

    setLoading(true);
    try {
      const interestData = {
        user_id: user.id,
        interest_date: selectedDate,
        wants_to_play: dayInterest.wants_to_play,
        time_preference: dayInterest.wants_to_play
          ? dayInterest.time_preference
          : null,
        transportation: dayInterest.wants_to_play
          ? dayInterest.transportation
          : null,
        partners: dayInterest.wants_to_play
          ? dayInterest.partners && dayInterest.partners.length > 0
            ? JSON.stringify(dayInterest.partners)
            : null
          : null,
        guest_count: dayInterest.wants_to_play
          ? Math.min(dayInterest.guest_count, 3)
          : null,
        notes: dayInterest.wants_to_play ? dayInterest.notes || null : null,
      };

      const { error } = await supabase.from("interests").upsert(interestData, {
        onConflict: "user_id,interest_date",
      });

      if (error) throw error;

      // Update marked dates
      const newMarkedDates = {
        ...markedDates,
        [selectedDate]: {
          marked: true,
          dotColor:
            dayInterest.transportation === "walking" ? "#10b981" : "#3b82f6",
          selectedColor:
            dayInterest.transportation === "walking" ? "#10b981" : "#3b82f6",
        },
      };
      setMarkedDates(newMarkedDates);

      // Reload all interests data to update stats
      await loadAllInterests();

      // Reload current month interests data
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const yearMonth = `${year}-${month}`;
      await loadInterests(yearMonth);

      setLoading(false);
      onSuccess();
    } catch (error) {
      console.error("Error saving interest:", error);
      setLoading(false);
      throw error;
    }
  };

  const loadInterestForDate = async (date: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("interests")
        .select("*")
        .eq("user_id", user.id)
        .eq("interest_date", date)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      return data;
    } catch (error) {
      console.error("Error loading interest for date:", error);
      return null;
    }
  };

  const getLockoutStatus = (date: string): LockoutStatus => {
    const isLocked = isDateLocked(date);
    const isApproachingLockout = isDateApproachingLockout(date);
    const daysUntilLockout = getDaysUntilLockout(date);
    const message = getLockoutStatusMessage(date);

    return {
      isLocked,
      isApproachingLockout,
      daysUntilLockout,
      message,
    };
  };

  return {
    interestsData,
    allInterestsData,
    markedDates,
    loading,
    loadInterests,
    loadAllInterests,
    saveInterest,
    loadInterestForDate,
    getLockoutStatus,
  };
}
