import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Pressable, Text, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import { useNotifications } from "@/hooks/useNotifications";
import SignOutButton from "./SignOutButton";
import Dashboard from "@/screens/Dashboard";
import InterestFormScreen from "@/screens/InterestFormScreen";
import TradesScreen from "@/screens/TradesScreen";
import AdminRoleManager from "./AdminRoleManager";
import GuestScheduleScreen from "@/screens/GuestScheduleScreen";

const Tabs = createBottomTabNavigator();

type TabConfig = {
  name: string;
  component: React.ComponentType<any>;
  title: string;
};

const ADMIN_TABS: TabConfig[] = [
  { name: "Dashboard", component: Dashboard, title: "Dashboard" },
  { name: "Interest", component: InterestFormScreen, title: "Interest" },
  { name: "Trades", component: TradesScreen, title: "Trades" },
  { name: "Users", component: AdminRoleManager, title: "Users" },
];

const MEMBER_TABS: TabConfig[] = [
  { name: "Dashboard", component: Dashboard, title: "Dashboard" },
  { name: "Interest", component: InterestFormScreen, title: "Interest" },
];

const GUEST_TABS: TabConfig[] = [
  { name: "Guest", component: GuestScheduleScreen, title: "Guest" },
];

function GroupHeaderRight() {
  const { selectGroup } = useGroup();
  return (
    <Pressable
      onPress={() => selectGroup(null)}
      style={{ paddingHorizontal: 12 }}
    >
      <Text style={{ color: "#0ea5e9", fontWeight: "600" }}>Change Group</Text>
    </Pressable>
  );
}

function AppTabs() {
  const { userProfile, loading, user } = useAuth();
  const { selectedGroup } = useGroup();
  const { unreadCount } = useNotifications(user?.id || null);

  // Show nothing while loading user profile
  if (loading || !userProfile) return null;

  if (!selectedGroup) {
    return null; // This will be handled by the parent navigator
  }

  const getTabsForRole = (role: string): TabConfig[] => {
    switch (role) {
      case "admin":
        return ADMIN_TABS;
      case "member":
        return MEMBER_TABS;
      case "guest":
        return GUEST_TABS;
      default:
        return GUEST_TABS;
    }
  };

  const tabs = getTabsForRole(userProfile.role);
  const headerTitle = selectedGroup.name;

  const getTabBarIcon = (tabName: string) => {
    if (tabName === "Dashboard" && unreadCount > 0) {
      return (
        <View style={{ position: "relative" }}>
          <Text style={{ fontSize: 20 }}>🏠</Text>
          <View
            style={{
              position: "absolute",
              top: -2,
              right: -8,
              backgroundColor: "#dc2626",
              borderRadius: 8,
              minWidth: 16,
              height: 16,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 10,
                fontWeight: "600",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <Tabs.Navigator
      initialRouteName={tabs[0].name}
      screenOptions={{
        headerLeft: () => <SignOutButton />,
        headerRight: () => <GroupHeaderRight />,
        headerTitle,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            title: tab.title,
            tabBarIcon: () => getTabBarIcon(tab.name),
          }}
        />
      ))}
    </Tabs.Navigator>
  );
}

export default AppTabs;
