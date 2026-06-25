import type { SectionState } from "../../contracts/section";
import type { ScaffoldContent } from "../../designer/sections/ScaffoldSection/types";
import type { CampaignInfoDto } from "../api";

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasChecklist(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => hasText(item));
}

export function adaptCampaignInfo(
  dto: Partial<CampaignInfoDto> | null | undefined,
): SectionState<ScaffoldContent> {
  if (!dto || !hasText(dto.name) || !hasText(dto.description)) {
    return {
      status: "error",
      error: "campaign_info_missing_required",
    };
  }

  return {
    status: "ready",
    content: {
      title: dto.name,
      description: dto.description,
      checklist: hasChecklist(dto.checklist) ? dto.checklist : [],
    },
  };
}
