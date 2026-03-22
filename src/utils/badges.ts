import type { ChatUserstate } from 'tmi.js';
import type { UserBadge } from '../types/chat';

/**
 * Parses the badges object from tmi.js tags into an array of badge metadata objects.
 * tmi.js tags.badges looks like: { broadcaster: '1', subscriber: '12', premium: '1' }
 * Twitch Badge CDN format: https://static-cdn.jtvnw.net/badges/v1/<badge_id>/1
 * 
 * Note: To get the exact <badge_id> requires querying the Twitch API per channel.
 * However, there are standard global/channel UUIDs that we can't easily guess without an API key. 
 * For a purely frontend overlay without a client ID, we can use the bttv/ffz/7tv or specific known URLs 
 * if we had them. Since we don't, we will use a highly compatible third-party badge proxy
 * or the known default global badge IDs.
 */

// Mapping of standard badge names to their global Twitch badge UUIDs
// (These are the official Twitch UUIDs for the most common global badges)
const GLOBAL_BADGE_IDS: Record<string, Record<string, string>> = {
  broadcaster: {
    '1': '5527c58c-fb7d-422d-b71b-f309dcb85cc1',
  },
  'bot-badge': {
    '1': '3ffa9565-c35b-4cad-800b-041e60659cf2',
  },
  moderator: {
    '1': '3267646d-33f0-4b17-b3df-f923a41db1d0',
  },
  vip: {
    '1': 'b817aba4-fad8-49e2-b88a-7cc744dfa6ec',
  },
  partner: {
    '1': 'd12a2e27-16f6-41d0-ab77-b780518f00a3',
  },
  premium: { // Prime Gaming
    '1': 'bbbe0db0-a598-423e-86d0-f9fb98ca1933', 
  },
  staff: {
    '1': 'd97c37bd-a6f5-4c38-8f57-4e4bef88af34',
  },
  admin: {
    '1': '9ef7e029-4cdf-4d4d-a0d5-e2b3fb2583fe',
  },
  'no_audio': {
    '1': 'aef2cd08-f29b-45a1-8c12-d44d7fd5e6f0',
  },
  'no_video': {
    '1': '199a0dba-58f3-494e-a7fc-1fa0a1001fb8',
  }
};

export function parseBadges(badges?: ChatUserstate['badges']): UserBadge[] {
  if (!badges) return [];

  const parsedBadges: UserBadge[] = [];

  for (const [badgeName, version] of Object.entries(badges)) {
    if (!version) continue;
    const globalId = GLOBAL_BADGE_IDS[badgeName]?.[version];
    
    // If it's a known global badge, we can render it directly from Twitch's CDN
    if (globalId) {
      parsedBadges.push({
        id: badgeName,
        version: version,
        url: `https://static-cdn.jtvnw.net/badges/v${version}/${globalId}/1`
      });
    } else {
      // For channel-specific badges (like subscribers, founders, or custom bits tiers), 
      // we would normally need to fetch the channel's badge set via the Twitch API.
      // Since this is a lightweight frontend-only overlay, we skip rendering unknown custom badges.
      // (A robust solution would involve fetching from https://api.twitch.tv/helix/chat/badges)
      console.warn(`Unknown badge or requires API context: ${badgeName} v${version}`);
    }
  }

  return parsedBadges;
}
