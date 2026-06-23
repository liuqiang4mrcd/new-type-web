import React from "react";
import { useReducer } from "react";
import ReactDOM from "react-dom/client";
import { createInitialAppState } from "../activity/initial-state";
import { activityReducer } from "../activity/reducer";
import { selectSectionState } from "../activity/selectors";
import type { SectionStateMap } from "../activity/types";
import { registerSections } from "./section-registry";

const sections = registerSections();

function PhonePreview() {
  const [appState] = useReducer(activityReducer, undefined, () =>
    createInitialAppState(),
  );

  return (
    <main className="min-h-screen" style={{ background: "#f7f8fb" }}>
      {sections.map((section) => {
        const sectionState = selectSectionState(
          appState,
          section.id as keyof SectionStateMap,
        );

        if (sectionState.status !== "ready" && section.stateViews[sectionState.status]) {
          const StateComp = section.stateViews[sectionState.status]!;
          return <StateComp key={section.id} message={sectionState.error} />;
        }

        return (
          <section.component
            key={section.id}
            content={sectionState.content ?? section.defaultContent}
            actions={section.defaultActions}
          />
        );
      })}
    </main>
  );
}

export function renderPhonePreview() {
  const root = ReactDOM.createRoot(document.getElementById("root")!);
  root.render(
    <React.StrictMode>
      <PhonePreview />
    </React.StrictMode>,
  );
}
