import type { I18nMessages } from "./types";

export const ar: I18nMessages = {
  scaffold: {
    title: "قالب الحملة",
    description:
      "استبدل هذا القالب المحايد بأقسام حقيقية بعد اعتماد بطاقات تصميم المكونات.",
    checklist: [
      "حدد هدف كل قسم قبل كتابة الكود.",
      "صرح فقط بالحالات الموجودة فعلا.",
      "تحقق من كل قسم قبل البدء في القسم التالي.",
    ],
    loading: "جار تحميل قالب الحملة...",
    error: "تعذر تحميل قالب الحملة.",
  },
  errors: {
    campaign_info_missing_required:
      "تنقص معلومات الحملة حقول مطلوبة.",
    campaign_load_failed: "تعذر تحميل الحملة.",
  },
};
