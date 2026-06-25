import { ScaffoldSection } from "../../designer/sections/ScaffoldSection";
import {
  ScaffoldError,
  ScaffoldLoading,
} from "../../designer/sections/ScaffoldSection/states";
import { useStore } from "../../integrations/store";

export function ScaffoldContainer() {
  const section = useStore((s) => s.sections.scaffold);

  if (!section) return null;

  switch (section.status) {
    case "loading":
      return <ScaffoldLoading />;
    case "error":
      return <ScaffoldError message={section.error} />;
    case "ready":
      if (!section.content) return null;
      return <ScaffoldSection content={section.content} />;
    default:
      return null;
  }
}
