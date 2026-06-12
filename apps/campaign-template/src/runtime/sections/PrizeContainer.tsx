import { useStore } from '../../integrations/store';
import { PrizeSection, type PrizeActions } from '../../designer/sections/PrizeSection';
import {
  PrizeLoading,
  PrizeEmpty,
  PrizeError,
} from '../../designer/sections/PrizeSection/states';
import { trackDrawClick } from '../../integrations/tracking';

export function PrizeContainer() {
  const prize = useStore((s) => s.prize);
  const drawing = useStore((s) => s.drawing);
  const drawLottery = useStore((s) => s.drawLottery);
  const closePrizeModal = useStore((s) => s.closePrizeModal);
  const lottery = useStore((s) => s.lottery);
  const showPrizeModal = useStore((s) => s.showPrizeModal);

  if (drawing) {
    return <PrizeLoading />;
  }

  switch (prize.status) {
    case 'loading':
      return <PrizeLoading />;
    case 'error':
      return <PrizeError message={prize.error} />;
    case 'empty':
      return <PrizeEmpty />;
    case 'ready':
      const prizeActions: PrizeActions = {
        onDraw: () => { trackDrawClick(); drawLottery(); },
        result: lottery.lastResult,
        showResult: showPrizeModal,
        onCloseResult: closePrizeModal,
      };
      return (
        <PrizeSection
          content={prize.content!}
          actions={prizeActions}
        />
      );
  }
}
