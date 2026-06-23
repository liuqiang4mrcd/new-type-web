# Activity State Kernel Design

> Date: 2026-06-23
> Status: Proposed for implementation

## Goal

Upgrade Playground from an isolated mock UI into an early simulator for real page interactions, without duplicating interaction rules between mock state, runtime store, and `ACTION_WIRING`.

## Directory Shape

```txt
src/activity/
  types.ts
  initial-state.ts
  actions.ts
  reducer.ts
  selectors/
    index.ts
    <section>.ts
```

## Ownership Boundaries

| Directory | Responsibility |
| --- | --- |
| `designer/` | Visual Section components, Section `Content` types, `defaultContent`. Content is the final render ViewModel, not the business source of truth. |
| `activity/` | Page-local interaction kernel: `AppState`, actions/commands, reducer, selectors. Pure TypeScript only. No React, Zustand, API, or tracking. |
| `integrations/` | External integrations: API, DTO adapters, fixtures, tracking, and the runtime Zustand shell. |
| `runtime/` | React assembly layer. Reads `appState`, uses activity selectors, and binds Section action props to business commands. |
| `playground/` | Designer simulator. Uses mock initial state plus the same activity reducer/selectors. Must not import `integrations/*`. |

## Data Flow

```txt
Runtime:
API DTO
  -> adapter -> DomainState
  -> createInitialAppState()
  -> activity reducer/actions
  -> selectors -> SectionState<Content>
  -> runtime container -> designer section

Playground:
mock scenario / fixture
  -> DomainState
  -> createInitialAppState()
  -> same activity reducer/actions
  -> same selectors -> SectionState<Content>
  -> preview renderer -> designer section
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

## Replacing `ACTION_WIRING`

Old model:

```txt
phone-preview ACTION_WIRING
  onOpenRule -> patch ruleModal.content.isOpen
```

New model:

```txt
onOpenRule -> dispatch(activityCommands.viewRules())
activity reducer -> modalStack push rule
selector -> ruleModal.content.isOpen = true
```

## Runtime Store Rules

```ts
interface RuntimeStore {
  appState: AppState;
  dispatch: (action: AppAction) => void;
  hydrateFromApi: () => Promise<void>;
  setAppState: (state: AppState) => void;
}
```

Rules:

- Normal page interactions must use `dispatch(AppAction)`.
- API initialization and reload may use `hydrateFromApi` or `setAppState`.
- Business buttons must not directly set Section content.

## Playground Rules

- Full-page scenarios describe `domain/ui` initial state, not `sections[]` content patches.
- Single-Section visual cases may use `contentOverride` or `statusOverride` for visual inspection only.
- `ContentEditor` is a Playground-only override layer. It must not write to `AppState` or enter the reducer.
- `playground/` must not import `integrations/*`.

## Documentation And Template Changes

- `docs/ai/development-rules.md`
  - Add `activity/` responsibility boundaries.
  - Forbid `playground/` importing `integrations/*`.
  - Require `dispatch` as the normal interaction entry.
  - Clarify that Section content is a render ViewModel, not the business source of truth.
- `docs/campaign-template.md`
  - Update template directory structure.
  - Update Section integration flow.
  - Split Playground full-page scenarios from single-Section visual cases.
- `apps/campaign-template/src/activity/`
  - Add the minimal activity kernel.
- Future validation:
  - Check `playground/` does not import `integrations/*`.
  - Check `activity/` does not import React, Zustand, API, or tracking.

## Migration Order

1. Migrate modal stack first.
2. Replace `ACTION_WIRING` with activity commands.
3. Change runtime store to `appState + dispatch`.
4. Add selectors for Modal SectionState output.
5. Change Playground full-page preview to mock `AppState`.
6. Migrate async flows such as crit, claim, and recharge.

## Key Decision

This does not add a second state system. It gives the existing scattered interaction rules one owner: the app-local `activity/` kernel.
