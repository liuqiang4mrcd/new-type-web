import { useEffect } from 'react';
import { ToastContainer, Modal } from '@new-type/ui';
import { useStore } from '../integrations/store';
import { HeroContainer } from '../runtime/sections/HeroContainer';
import { RuleContainer } from '../runtime/sections/RuleContainer';
import { PrizeContainer } from '../runtime/sections/PrizeContainer';
import { trackPageView } from '../integrations/tracking';

export function App() {
  const loadCampaign = useStore((s) => s.loadCampaign);
  const lottery = useStore((s) => s.lottery);
  const showPrizeModal = useStore((s) => s.showPrizeModal);
  const closePrizeModal = useStore((s) => s.closePrizeModal);

  useEffect(() => {
    loadCampaign();
    trackPageView();
  }, [loadCampaign]);

  return (
    <main className="min-h-screen bg-white">
      <HeroContainer />
      <RuleContainer />
      <PrizeContainer />

      {/* 抽奖结果弹窗 — store 驱动 */}
      <Modal open={showPrizeModal} onClose={closePrizeModal}>
        <div className="text-center py-4">
          <p className="text-lg font-bold mb-2">
            {lottery.lastResult?.isWin ? '恭喜中奖！' : '很遗憾'}
          </p>
          <p className="text-gray-600 mb-4">
            {lottery.lastResult?.prize || ''}
          </p>
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm"
            onClick={closePrizeModal}
          >
            知道了
          </button>
        </div>
      </Modal>

      <ToastContainer />
    </main>
  );
}
