import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Weekend } from "../types";

export const useWeekends = () => {
  const [weekends, setWeekends] = useState<Weekend[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadWeekends = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("weekends")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error loading weekends:", error);
        return;
      }

      setWeekends(data || []);
    } catch (error) {
      console.error("Error loading weekends:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeekends();
  }, []);

  return { weekends, loading, refresh: loadWeekends };
};
