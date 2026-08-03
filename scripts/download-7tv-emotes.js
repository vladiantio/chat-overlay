import fs from "node:fs/promises";

const EMOTE_PATH = "./src/features/emotes/global-stv.json";
const STV_QUERY = `
  query EmoteSearch(
    $query: String,
    $tags: [String!]!,
    $sortBy: SortBy!,
    $filters: Filters,
    $page: Int,
    $perPage: Int!
  ) {
    emotes {
      search(
        query: $query,
        tags: {tags: $tags, match: ANY},
        sort: {sortBy: $sortBy, order: DESCENDING},
        filters: $filters,
        page: $page,
        perPage: $perPage
      ) {
        items {
          id
          defaultName
        }
      }
    }
  }
`;
const NAMES_EXCLUDED =
  "0|????|((|)|aza|job|LO|mion|o|ok|oop|papa|que|SON|sus|vp|w|WAS|yo|Yo";

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchEmotes(page = 1) {
  const variables = {
    query: null,
    tags: [],
    sortBy: "TRENDING_WEEKLY",
    filters: null,
    page,
    perPage: 100,
  };

  const resp = await fetch("https://api.7tv.app/v4/gql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: STV_QUERY, variables }),
  });

  const json = await resp.json();
  const emotes = json.data.emotes.search.items
    .filter((e) => !NAMES_EXCLUDED.split("|").includes(e.defaultName))
    .map((e) => ({
      id: e.id,
      name: e.defaultName,
    }));

  return emotes;
}

async function saveToFS(emotes) {
  await fs.writeFile(EMOTE_PATH, JSON.stringify({ emotes }));
}

try {
  if (await fileExists(EMOTE_PATH)) {
    if (process.argv.includes("--force")) {
      console.log("✔ Forcing overwrite...");
    } else {
      console.log(
        `✔ File already exists: ${EMOTE_PATH}. Overwrite using --force`,
      );
      process.exit(0);
    }
  }

  console.log("Fetching emotes from API...");
  let emotes = [];
  let i = 0;
  while (i !== -1) {
    try {
      const data = await fetchEmotes(i);
      for (const emote of data) {
        if (emotes.findIndex((e) => e.name === emote.name) !== -1) continue;
        emotes.push(emote);
      }
      i++;
    } catch {
      i = -1;
    }
  }
  console.log(`✔ Fetched ${emotes.length} emotes.`);

  await saveToFS(emotes);
  console.log(`✔ Saved to ${EMOTE_PATH}`);
} catch (err) {
  console.error("✖ Error:", err.message);
  process.exit(1);
}
