import { createRequest } from "@new-type/request";

export interface CampaignInfoDto {
  name: string;
  description: string;
  checklist: string[];
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const request = createRequest({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
});

async function loadMockApi() {
  return import("./mock");
}

export async function getCampaignInfo(): Promise<CampaignInfoDto> {
  if (USE_MOCK) {
    const mock = await loadMockApi();
    return mock.getCampaignInfo();
  }

  return request.get<CampaignInfoDto>("/campaign/info");
}
