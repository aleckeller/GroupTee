import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthScreen from "@/screens/AuthScreen";
import GroupPickerScreen from "@/screens/GroupPickerScreen";
import TeeTimeAssignmentScreen from "@/screens/TeeTimeAssignmentScreen";
import AppTabs from "@/components/AppTabs";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";

const Stack = createNativeStackNavigator();

function AppTabsWrapper() {
  const { userProfile, loading } = useAuth();
  const { selectedGroup } = useGroup();

  // Show nothing while loading user profile
  if (loading || !userProfile) return null;

  if (!selectedGroup) {
    return <GroupPickerScreen />;
  }

  return <AppTabs />;
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          <Stack.Screen name="Tabs" component={AppTabsWrapper} />
          <Stack.Screen
            name="TeeTimeAssignment"
            component={TeeTimeAssignmentScreen}
            options={{
              headerShown: true,
              title: "Assign Players",
              headerBackTitle: "Back",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
