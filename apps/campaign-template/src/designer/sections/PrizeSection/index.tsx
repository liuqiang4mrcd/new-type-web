import { Modal } from '@new-type/ui';
import type { SectionProps } from '../../../contracts/section';
import type { PrizeContent } from './types';

export interface PrizeActions {
  onDraw: () => void;
  result: { prize: string; isWin: boolean } | null;
  showResult: boolean;
  onCloseResult: () => void;
}

export function PrizeSection({ content, actions }: SectionProps<PrizeContent, PrizeActions>) {
  return (
    <section className="px-6 py-10">
      <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
        {content.title}
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {content.prizes.map((prize, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl p-4 text-center shadow-sm"
          >
            <p className="text-sm font-medium text-gray-700">{prize.name}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          className="bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold px-8 py-3 rounded-full text-lg shadow-lg active:scale-95 transition-transform"
          onClick={actions?.onDraw}
        >
          {content.drawButtonText}
        </button>
      </div>

      <Modal open={!!actions?.showResult} onClose={() => actions?.onCloseResult()}>
        <div className="text-center py-4">
          <p className="text-lg font-bold mb-2">
            {actions?.result?.isWin ? '恭喜中奖！' : '很遗憾'}
          </p>
          <p className="text-gray-600 mb-4">{actions?.result?.prize}</p>
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm"
            onClick={() => actions?.onCloseResult()}
          >
            知道了
          </button>
        </div>
      </Modal>
    </section>
  );
}
