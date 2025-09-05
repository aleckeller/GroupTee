import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Pressable, Text } from "react-native";
import AuthScreen from "@/screens/AuthScreen";
import AdminDashboard from "@/screens/AdminDashboard";
import InterestFormScreen from "@/screens/InterestFormScreen";
import MemberDashboard from "@/screens/MemberDashboard";
import TradesScreen from "@/screens/TradesScreen";
import GuestScheduleScreen from "@/screens/GuestScheduleScreen";
import AdminRoleManager from "@/components/AdminRoleManager";
import GroupPickerScreen from "@/screens/GroupPickerScreen";
import SignOutButton from "@/components/SignOutButton";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

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

function AdminTabs() {
  const { selectedGroup } = useGroup();
  return (
    <Tabs.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerLeft: () => <SignOutButton />,
        headerRight: () => <GroupHeaderRight />,
        headerTitle: selectedGroup ? `${selectedGroup.name}` : "Select Group",
      }}
    >
      <Tabs.Screen name="Dashboard" component={AdminDashboard} />
      <Tabs.Screen name="Interest" component={InterestFormScreen} />
      <Tabs.Screen name="Member" component={MemberDashboard} />
      <Tabs.Screen name="Trades" component={TradesScreen} />
      <Tabs.Screen name="Users" component={AdminRoleManager} />
    </Tabs.Navigator>
  );
}

function MemberTabs() {
  const { selectedGroup } = useGroup();
  return (
    <Tabs.Navigator
      initialRouteName="Interest"
      screenOptions={{
        headerLeft: () => <SignOutButton />,
        headerRight: () => <GroupHeaderRight />,
        headerTitle: selectedGroup
          ? `Group: ${selectedGroup.name}`
          : "Select Group",
      }}
    >
      <Tabs.Screen name="Interest" component={InterestFormScreen} />
      <Tabs.Screen name="Member" component={MemberDashboard} />
    </Tabs.Navigator>
  );
}

function GuestTabs() {
  const { selectedGroup } = useGroup();
  return (
    <Tabs.Navigator
      initialRouteName="Guest"
      screenOptions={{
        headerLeft: () => <SignOutButton />,
        headerRight: () => <GroupHeaderRight />,
        headerTitle: selectedGroup
          ? `Group: ${selectedGroup.name}`
          : "Select Group",
      }}
    >
      <Tabs.Screen name="Guest" component={GuestScheduleScreen} />
    </Tabs.Navigator>
  );
}

function AppTabs() {
  const { userProfile, loading } = useAuth();
  const { selectedGroup } = useGroup();

  // Show nothing while loading user profile
  if (loading || !userProfile) return null;

  if (!selectedGroup) {
    return <GroupPickerScreen />;
  }

  switch (userProfile.role) {
    case "admin":
      return <AdminTabs />;
    case "member":
      return <MemberTabs />;
    case "guest":
      return <GuestTabs />;
    default:
      return <GuestTabs />;
  }
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <Stack.Screen name="Tabs" component={AppTabs} />
      )}
    </Stack.Navigator>
  );
}
