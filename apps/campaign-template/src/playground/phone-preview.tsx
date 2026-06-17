import React from "react";
import { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { registerSections } from "./section-registry";

const sections = registerSections();

type ActionHandler = (...args: unknown[]) => void;

interface ActionWire {
  targetSectionId: string;
  content:
    | Record<string, unknown>
    | ((
        args: unknown[],
        currentContent: Record<string, unknown>,
      ) => Record<string, unknown>);
}

type ActionWiring = Record<string, Record<string, ActionWire | ActionWire[]>>;

export const ACTION_WIRING: ActionWiring = {};

function normalizeWires(wire: ActionWire | ActionWire[]): ActionWire[] {
  return Array.isArray(wire) ? wire : [wire];
}

function PhonePreview() {
  const [contentById, setContentById] = useState<
    Record<string, Record<string, unknown>>
  >(() =>
    Object.fromEntries(
      sections.map((section) => [section.id, section.defaultContent]),
    ),
  );

  const actionsById = useMemo(() => {
    return Object.fromEntries(
      sections.map((section) => {
        const sectionWiring = ACTION_WIRING[section.id] ?? {};
        const wiredActions = Object.fromEntries(
          Object.entries(sectionWiring).map(([actionName, wire]) => [
            actionName,
            (...args: unknown[]) => {
              setContentById((current) => {
                const next = { ...current };
                for (const item of normalizeWires(wire)) {
                  const previousContent =
                    next[item.targetSectionId] ??
                    sections.find((s) => s.id === item.targetSectionId)
                      ?.defaultContent ??
                    {};
                  const patch =
                    typeof item.content === "function"
                      ? item.content(args, previousContent)
                      : item.content;
                  next[item.targetSectionId] = {
                    ...previousContent,
                    ...patch,
                  };
                }
                return next;
              });
            },
          ]),
        );

        return [
          section.id,
          {
            ...(section.defaultActions as
              | Record<string, ActionHandler>
              | undefined),
            ...wiredActions,
          },
        ];
      }),
    );
  }, []);

  return (
    <main className="min-h-screen" style={{ background: "#f7f8fb" }}>
      {sections.map((section) => (
        <section.component
          key={section.id}
          content={contentById[section.id] ?? section.defaultContent}
          actions={actionsById[section.id]}
        />
      ))}
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
