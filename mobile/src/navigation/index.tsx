import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthScreen from "@/screens/AuthScreen";
import GroupPickerScreen from "@/screens/GroupPickerScreen";
import TeeTimeAssignmentScreen from "@/screens/TeeTimeAssignmentScreen";
import RedeemInviteScreen from "@/screens/RedeemInviteScreen";
import {
  SysadminDashboardScreen,
  ClubAdminDashboardScreen,
  ClubDetailScreen,
  GroupDetailScreen,
  InviteUserScreen,
} from "@/screens/admin";
import AppTabs from "@/components/AppTabs";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import { useSystemRole } from "@/hooks/useSystemRole";
import { AdminStackParamList, RootStackParamList } from "@/types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();

function AdminNavigator() {
  const { isSysadmin } = useSystemRole();

  return (
    <AdminStack.Navigator>
      {isSysadmin ? (
        <AdminStack.Screen
          name="SysadminDashboard"
          component={SysadminDashboardScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <AdminStack.Screen
          name="ClubAdminDashboard"
          component={ClubAdminDashboardScreen}
          options={{ headerShown: false }}
        />
      )}
      <AdminStack.Screen
        name="ClubDetail"
        component={ClubDetailScreen}
        options={{
          title: "Club Details",
          headerBackTitle: "Back",
        }}
      />
      <AdminStack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{
          title: "Group Details",
          headerBackTitle: "Back",
        }}
      />
      <AdminStack.Screen
        name="InviteUser"
        component={InviteUserScreen}
        options={{
          title: "Invite User",
          headerBackTitle: "Back",
        }}
      />
    </AdminStack.Navigator>
  );
}

function AppTabsWrapper() {
  const { userProfile, loading: authLoading } = useAuth();
  const { selectedGroup, groups, loading: groupsLoading } = useGroup();
  const { systemRole, loading: roleLoading } = useSystemRole();

  // Show loading indicator while loading
  if (authLoading || groupsLoading || roleLoading || !userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  // Sysadmins and club admins get the admin interface
  if (systemRole === "sysadmin" || systemRole === "club_admin") {
    return <AdminNavigator />;
  }

  // Users with no memberships go to redeem invite screen
  if (groups.length === 0) {
    return <RedeemInviteScreen />;
  }

  // Users without a selected group go to group picker
  if (!selectedGroup) {
    return <GroupPickerScreen />;
  }

  // Normal users get the regular app
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
          <Stack.Screen
            name="InviteUser"
            component={InviteUserScreen}
            options={{
              headerShown: true,
              title: "Add Member",
              headerBackTitle: "Back",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
});
