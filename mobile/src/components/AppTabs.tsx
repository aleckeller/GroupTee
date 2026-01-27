import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import HeaderAvatar from "./HeaderAvatar";
import HeaderTitle from "./HeaderTitle";
import HeaderNotificationBell from "./HeaderNotificationBell";
import Dashboard from "@/screens/Dashboard";
import CalendarInterestScreen from "@/screens/CalendarInterestScreen";
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
  { name: "Interest", component: CalendarInterestScreen, title: "Interest" },
  // { name: "Trades", component: TradesScreen, title: "Trades" }, // Temporarily disabled
  { name: "Roster", component: AdminRoleManager, title: "Roster" },
];

const MEMBER_TABS: TabConfig[] = [
  { name: "Dashboard", component: Dashboard, title: "Dashboard" },
  { name: "Interest", component: CalendarInterestScreen, title: "Interest" },
  { name: "Roster", component: AdminRoleManager, title: "Roster" },
];

const GUEST_TABS: TabConfig[] = [
  { name: "Guest", component: GuestScheduleScreen, title: "Guest" },
  { name: "Roster", component: AdminRoleManager, title: "Roster" },
];

function AppTabs() {
  const { userProfile, loading } = useAuth();
  const { selectedGroup } = useGroup();

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

  const getTabBarIcon = (tabName: string, focused: boolean) => {
    const iconSize = 24;
    const iconColor = focused ? "#007AFF" : "#8E8E93";

    if (tabName === "Dashboard") {
      return <Ionicons name="home" size={iconSize} color={iconColor} />;
    }

    if (tabName === "Interest") {
      return <Ionicons name="calendar" size={iconSize} color={iconColor} />;
    }

    if (tabName === "Roster") {
      return <Ionicons name="people" size={iconSize} color={iconColor} />;
    }

    if (tabName === "Trades") {
      return (
        <Ionicons name="swap-horizontal" size={iconSize} color={iconColor} />
      );
    }

    return null;
  };

  return (
    <Tabs.Navigator
      initialRouteName={tabs[0].name}
      screenOptions={{
        headerLeft: () => <HeaderAvatar />,
        headerRight: () => <HeaderNotificationBell />,
        headerTitle: () => <HeaderTitle />,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => getTabBarIcon(tab.name, focused),
          }}
        />
      ))}
    </Tabs.Navigator>
  );
}

export default AppTabs;
