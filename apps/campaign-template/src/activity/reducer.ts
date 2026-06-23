import type { AppAction, AppState, ModalEntry, ModalId } from './types';

function pushModal(stack: ModalEntry[], id: ModalId, payload?: unknown) {
  return [...stack.filter((entry) => entry.id !== id), { id, payload }];
}

export function activityReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'modal/push':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalStack: pushModal(state.ui.modalStack, action.id, action.payload),
        },
      };
    case 'modal/pop':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalStack: state.ui.modalStack.slice(0, -1),
        },
      };
    case 'modal/close':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalStack: state.ui.modalStack.filter((entry) => entry.id !== action.id),
        },
      };
    case 'modal/replace':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalStack: pushModal(state.ui.modalStack.slice(0, -1), action.id, action.payload),
        },
      };
    case 'modal/clear':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalStack: [],
        },
      };
    default:
      return state;
  }
}
