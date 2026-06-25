import type { SectionState } from '../contracts/section';
import type { ScaffoldContent } from '../designer/sections/ScaffoldSection/types';
import type { SupportedLang } from '../i18n';
import type { TextDirection } from '@new-type/utils';

export type ModalId = string;

export interface ModalEntry {
  id: ModalId;
  payload?: unknown;
}

export interface DomainState {
  // Activity-specific business facts are added by each campaign.
  sections?: Partial<SectionStateMap>;
}

export interface UiState {
  modalStack: ModalEntry[];
  lang: SupportedLang;
  textDirection: TextDirection;
}

export interface AppState {
  domain: DomainState;
  ui: UiState;
}

export type AppAction =
  | { type: 'modal/push'; id: ModalId; payload?: unknown }
  | { type: 'modal/pop' }
  | { type: 'modal/close'; id: ModalId }
  | { type: 'modal/replace'; id: ModalId; payload?: unknown }
  | { type: 'modal/clear' };

export interface SectionStateMap {
  scaffold: SectionState<ScaffoldContent>;
}
