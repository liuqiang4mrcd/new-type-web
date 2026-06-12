import { pageView, click } from '@new-type/analytics';

export function trackPageView() {
  pageView();
}

export function trackHeroClick() {
  click('hero_btn');
}

export function trackRuleView() {
  click('rule_view');
}

export function trackDrawClick() {
  click('draw_btn');
}

export function trackClaimClick() {
  click('claim_btn');
}

export function trackPrizeView(prizeName: string) {
  click('prize_view', { prize: prizeName });
}
