export interface PrizeItem {
  name: string;
  image?: string;
}

export interface PrizeContent {
  title: string;
  prizes: PrizeItem[];
  drawButtonText: string;
  winRate: number;
}
