import { describe, expect, it } from "vitest";
import normalFixture from "../fixtures/campaign-info.normal.json";
import missingRequiredFixture from "../fixtures/campaign-info.missing-required.json";
import { adaptCampaignInfo } from "./campaignInfo.adapter";
import type { ApiEnvelope } from "@new-type/request";
import type { CampaignInfoDto } from "../api";

describe("adaptCampaignInfo", () => {
  it("maps normal campaign info to ScaffoldSection content", () => {
    const fixture = normalFixture as ApiEnvelope<CampaignInfoDto>;
    const state = adaptCampaignInfo(fixture.data);

    expect(state.status).toBe("ready");
    expect(state.content).toEqual({
      title: "Campaign Template",
      description:
        "Replace this scaffold section with campaign-specific sections.",
      checklist: [
        "Define each Section purpose before writing code.",
        "Keep design sample data out of runtime fallbacks.",
        "Validate one Section before starting the next.",
      ],
    });
  });

  it("returns error when required display fields are missing", () => {
    const fixture = missingRequiredFixture as ApiEnvelope<
      Partial<CampaignInfoDto>
    >;
    const state = adaptCampaignInfo(fixture.data);

    expect(state).toEqual({
      status: "error",
      error: "campaign_info_missing_required",
    });
  });

  it("normalizes missing optional checklist to an empty list", () => {
    const state = adaptCampaignInfo({
      name: "Campaign Template",
      description: "Scaffold description",
    });

    expect(state).toEqual({
      status: "ready",
      content: {
        title: "Campaign Template",
        description: "Scaffold description",
        checklist: [],
      },
    });
  });
});
