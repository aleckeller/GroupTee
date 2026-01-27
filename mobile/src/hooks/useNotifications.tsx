import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";
import { Notification } from "../types";
import { useAuth } from "./useAuth";
import {
  registerForPushNotificationsAsync,
  savePushToken,
  removePushToken,
} from "@/lib/pushNotifications";

interface NotificationsContextValue {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n: Notification) => !n.read).length || 0);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [userId]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", notificationId);

        if (error) throw error;

        setNotifications((prev) => {
          const toDelete = prev.find((n) => n.id === notificationId);
          if (toDelete && !toDelete.read) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return prev.filter((n) => n.id !== notificationId);
        });
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    []
  );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    async function setupPush() {
      const token = await registerForPushNotificationsAsync();
      if (token && isMounted) {
        setExpoPushToken(token);
        await savePushToken(userId!, token);
      }
    }

    setupPush();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Clean up push token on sign-out (userId becomes null)
  useEffect(() => {
    return () => {
      if (expoPushToken && userId) {
        removePushToken(userId, expoPushToken);
      }
    };
  }, [expoPushToken, userId]);

  // Listen for incoming push notifications
  useEffect(() => {
    // Refresh in-app list when a push is received while foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {
        loadNotifications();
      });

    // Refresh in-app list when user taps a push notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(() => {
        loadNotifications();
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [loadNotifications]);

  const value: NotificationsContextValue = {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextValue => {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationsProvider"
    );
  return ctx;
};
