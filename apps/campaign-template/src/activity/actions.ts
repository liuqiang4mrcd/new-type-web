import type { AppAction, ModalId } from './types';

export const activityCommands = {
  pushModal: (id: ModalId, payload?: unknown): AppAction => ({
    type: 'modal/push',
    id,
    payload,
  }),
  popModal: (): AppAction => ({ type: 'modal/pop' }),
  closeModal: (id: ModalId): AppAction => ({ type: 'modal/close', id }),
  replaceModal: (id: ModalId, payload?: unknown): AppAction => ({
    type: 'modal/replace',
    id,
    payload,
  }),
  clearModals: (): AppAction => ({ type: 'modal/clear' }),
};
