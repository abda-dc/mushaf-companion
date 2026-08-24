/// <reference types="@capacitor/local-notifications" />

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mushafcompanion.reader",
  appName: "Mushaf Companion",
  webDir: "mobile-shell",
  appendUserAgent: " MushafCompanionNative/0.6",
  server: {
    url: "https://mushaf-companion.abda-dc.chatgpt.site",
    cleartext: false,
    allowNavigation: ["mushaf-companion.abda-dc.chatgpt.site"],
  },
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
