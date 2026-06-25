import { ScaffoldSection } from "../../designer/sections/ScaffoldSection";
import {
  ScaffoldError,
  ScaffoldLoading,
} from "../../designer/sections/ScaffoldSection/states";
import { useStore } from "../../integrations/store";
import { getI18nMessages } from "../../i18n";

export function ScaffoldContainer() {
  const section = useStore((s) => s.sections.scaffold);
  const lang = useStore((s) => s.ui.lang);
  const messages = getI18nMessages(lang);

  if (!section) return null;

  switch (section.status) {
    case "loading":
      return (
        <ScaffoldLoading
          message={messages.scaffold.loading}
        />
      );
    case "error":
      return (
        <ScaffoldError
          message={
            section.error
              ? messages.errors[section.error] ?? section.error
              : messages.scaffold.error
          }
        />
      );
    case "ready":
      if (!section.content) return null;
      return <ScaffoldSection content={section.content} />;
    default:
      return null;
  }
}
