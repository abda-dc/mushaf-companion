/// <reference types="@capacitor/local-notifications" />

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mushafcompanion.reader",
  appName: "Mushaf Companion",
  webDir: "native-runtime",
  appendUserAgent: " MushafCompanionNative/0.6",
  android: {
    allowMixedContent: false,
    backgroundColor: "#0f3028",
  },
  ios: {
    backgroundColor: "#0f3028",
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
  plugins: {
    LocalNotifications: {
      presentationOptions: ["sound", "banner", "list"],
    },
  },
};

export default config;
