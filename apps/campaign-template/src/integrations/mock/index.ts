import campaignInfoNormal from "../fixtures/campaign-info.normal.json";
import type { ApiEnvelope } from "@new-type/request";
import type { CampaignInfoDto } from "../api";

const MOCK_DELAY = 300;

function delay(ms = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function getCampaignInfo(): Promise<CampaignInfoDto> {
  await delay();
  const envelope = clone(campaignInfoNormal) as ApiEnvelope<CampaignInfoDto>;
  return envelope.data;
}
