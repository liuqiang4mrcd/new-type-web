import type { I18nMessages } from "./types";

export const en: I18nMessages = {
  scaffold: {
    title: "Campaign Scaffold",
    description:
      "Replace this neutral scaffold with real Sections after the component design cards are confirmed.",
    checklist: [
      "Define each Section purpose before writing code.",
      "Declare only states that really exist.",
      "Validate one Section before starting the next.",
    ],
    loading: "Loading campaign scaffold...",
    error: "Campaign scaffold failed to load.",
  },
  errors: {
    campaign_info_missing_required:
      "Campaign info is missing required fields.",
    campaign_load_failed: "Campaign failed to load.",
  },
};
