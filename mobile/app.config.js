// Load .env if present
try {
  require("dotenv").config();
} catch (e) {}

module.exports = {
  name: "GroupTee",
  slug: "group-tee",
  scheme: "gtt",
  version: "0.1.0",
  orientation: "portrait",
  owner: "aleckeller13",
  plugins: ["expo-notifications"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.grouptee.app",
  },
  android: {
    package: "com.grouptee.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FFFFFF",
    },
  },
  extra: {
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
    API_URL: process.env.API_URL || "http://127.0.0.1:8000",
    eas: {
      projectId: "3505ccac-ea4d-493e-89bf-4c100bb94160",
    },
  },
};
