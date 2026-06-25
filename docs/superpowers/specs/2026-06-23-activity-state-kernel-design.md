# Activity State Kernel Design

> Date: 2026-06-23
> Status: Proposed for implementation

## Goal

Upgrade Playground from an isolated mock UI into an early simulator for real page interactions, without duplicating interaction rules between mock state and runtime store.

## Directory Shape

```txt
src/activity/
  types.ts
  initial-state.ts
  actions.ts
  reducer.ts
```

## Ownership Boundaries

| Directory | Responsibility |
| --- | --- |
| `designer/` | Visual Section components, Section `Content` types, `defaultContent`. Content is the final render ViewModel, not the business source of truth. |
| `activity/` | Page-local interaction kernel: `AppState`, actions/commands, reducer. Pure TypeScript only. No React, Zustand, API, or tracking. |
| `integrations/` | External integrations: API, DTO adapters, fixtures, tracking, and the runtime Zustand shell. |
| `runtime/` | React assembly layer. Reads Zustand `domain/ui/sections` primitives or stable references, and binds Section action props to business commands. |
| `playground/` | Designer simulator. Single-Section tools use `defaultContent`; `phone-preview` installs preview `RuntimeViewState` and renders the shared `RuntimePage`. |

## Data Flow

```txt
Runtime:
API DTO
  -> adapter -> DomainState + SectionState<Content>
  -> createInitialAppState()
  -> activity reducer/actions
  -> Zustand domain/ui/sections
  -> runtime container -> designer section

Playground:
playground/preview-state.ts
  -> RuntimeViewState
  -> Zustand domain/ui/sections
  -> RuntimePage -> runtime container -> designer section
```

## Modal Model

```ts
interface UiState {
  modalStack: Array<{
    id: ModalId;
    payload?: unknown;
  }>;
}
```

Rules:

- `pushModal(id)`: if `id` does not exist, append it to the top. If it exists, update its payload and move it to the top.
- `popModal()`: close the top modal.
- `closeModal(id)`: close a specific modal.
- `replaceModal(id)`: replace the top modal.
- `clearModals()`: close all modals.

`content.isOpen` is not the source of truth. Selectors derive it from `ui.modalStack`.

## Replacing Playground Content Patches

Old model:

```txt
phone-preview preview-state
  onOpenRule -> patch ruleModal.content.isOpen
```

New model:

```txt
onOpenRule -> dispatch(activityCommands.viewRules())
activity reducer -> modalStack push rule
runtime container -> ruleModal.content.isOpen = true
```

## Runtime Store Rules

```ts
interface RuntimeStore {
  domain: DomainState;
  ui: UiState;
  sections: Partial<SectionStateMap>;
  dispatch: (action: AppAction) => void;
  hydrateFromApi: () => Promise<void>;
  setAppState: (state: AppState) => void;
}
```

Rules:

- Normal page interactions must use `dispatch(AppAction)`.
- API initialization and reload may use `hydrateFromApi` or `setAppState`.
- Business buttons must not directly set Section content.
- Runtime components must not call `useStore((s) => selectXxxSection(s.appState))`.
- Zustand hook selectors must subscribe to raw fields or primitives such as `s.sections.hero`, `s.ui.activeContentTab`, or `s.domain.countdownTargetAt`.
- ViewModel composition that combines multiple fields belongs in runtime containers/hooks with `useMemo`, not inside Zustand selectors.

## Playground Rules

- Full-page preview initializes `RuntimeViewState` in `playground/preview-state.ts` and renders `RuntimePage`.
- Single-Section visual cases may use `contentOverride` or `statusOverride` for visual inspection only.
- `ContentEditor` is a Playground-only override layer. It must not write to `AppState` or enter the reducer.
- Only `phone-preview.tsx` may import the store entry from `integrations/store`; Playground must not import API or tracking modules.

## Documentation And Template Changes

- `docs/ai/development-rules.md`
  - Add `activity/` responsibility boundaries.
  - Forbid Playground importing API/tracking modules.
  - Require `dispatch` as the normal interaction entry.
  - Clarify that Section content is a render ViewModel, not the business source of truth.
- `docs/campaign-template.md`
  - Update template directory structure.
  - Update Section integration flow.
  - Split Playground full-page scenarios from single-Section visual cases.
- `apps/campaign-template/src/activity/`
  - Add the minimal activity kernel.
- Future validation:
  - Check Playground does not import API/tracking modules.
  - Check `activity/` does not import React, Zustand, API, or tracking.

## Migration Order

1. Migrate modal stack first.
2. Replace Playground content patch wiring with preview `RuntimeViewState` plus activity commands.
3. Change runtime store to top-level `domain + ui + sections + dispatch`.
4. Remove activity selectors from runtime and full-page preview paths.
5. Change Playground full-page preview to initialize `RuntimeViewState`.
6. Migrate async flows such as crit, claim, and recharge.

## Key Decision

This does not add a second state system. It gives the existing scattered interaction rules one owner: the app-local `activity/` kernel.
