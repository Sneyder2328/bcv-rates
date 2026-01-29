import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthModal } from "../screens/AuthModal";
import { HistoryScreen } from "../screens/HistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  History: undefined;
  Auth: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen
        name="Auth"
        component={AuthModal}
        options={{
          presentation: "modal",
        }}
      />
    </Stack.Navigator>
  );
}
