import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Pressable, Text } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
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
  const headerTitle = selectedGroup.name;

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
          options={{ title: tab.title }}
        />
      ))}
    </Tabs.Navigator>
  );
}

export default AppTabs;
