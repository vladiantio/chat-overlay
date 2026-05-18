import type { ChatUserstate } from "tmi.js";

import type { UserBadge } from "@/types/chat";

import { badges } from "./badges";

export function parseBadges(userBadges?: ChatUserstate["badges"]): UserBadge[] {
  if (!userBadges) return [];

  const parsedBadges: UserBadge[] = [];

  for (const [badgeName, version] of Object.entries(userBadges)) {
    if (!version) continue;
    const badge = badges.find((b) => b.text === `${badgeName}/${version}`);

    if (badge) {
      parsedBadges.push({
        id: badgeName,
        version,
        description: badge.description,
        url: badge.image,
      });
    } else {
      console.warn(
        `Unknown badge or requires API context: ${badgeName} v${version}`,
      );
    }
  }

  return parsedBadges;
}
