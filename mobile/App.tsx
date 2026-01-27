import "react-native-url-polyfill/auto";
import "./src/lib/pushNotifications"; // Initialize notification handler before components mount
import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/hooks/useAuth";
import { GroupProvider } from "./src/hooks/useGroup";
import { NotificationsProvider } from "./src/hooks/useNotifications";
import RootNavigator from "./src/navigation";

export default function App() {
  return (
    <AuthProvider>
      <GroupProvider>
        <NotificationsProvider>
          <NavigationContainer theme={DefaultTheme}>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </NotificationsProvider>
      </GroupProvider>
    </AuthProvider>
  );
}
