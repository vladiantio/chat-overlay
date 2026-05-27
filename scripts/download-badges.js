import fs from "node:fs/promises";

const BADGE_PATH = "./src/features/badges/badges.json";

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function getAPIData() {
  const res = await fetch(
    "https://api.streamdatabase.com/twitch/global-badges/",
  );
  const { data } = await res.json();
  return data;
}

function transformResponse(data) {
  return data
    .map((badge) => badge.current)
    .map((badge) => {
      const parts = badge.set_id.split("_");
      const lastPart = parts[parts.length - 1];
      const value =
        parts.length > 1 && !isNaN(Number(lastPart)) ? Number(lastPart) : 1;
      const baseName =
        parts.length > 1 && !isNaN(Number(lastPart))
          ? parts.slice(0, -1).join("_")
          : badge.set_id;
      const versionId = value > 1 ? String(value) : badge.version.id;

      return {
        text: `${baseName}/${versionId}`,
        image: badge.version.image_url_4x,
        description: badge.version.title,
        value,
      };
    });
}
async function saveToFS(badges) {
  await fs.writeFile(BADGE_PATH, JSON.stringify({ badges }, null, "\t"));
}

try {
  if (await fileExists(BADGE_PATH)) {
    if (process.argv.includes("--force")) {
      console.log("✔ Forcing overwrite...");
    } else {
      console.log(
        `✔ File already exists: ${BADGE_PATH}. Overwrite using --force`,
      );
      process.exit(0);
    }
  }

  console.log("Fetching badges from API...");
  const APIData = await getAPIData();
  console.log(`✔ Fetched ${APIData.length} badges.`);

  const transformedResponse = transformResponse(APIData);
  console.log(`✔ Transformed ${transformedResponse.length} entries.`);

  await saveToFS(transformedResponse);
  console.log(`✔ Saved to ${BADGE_PATH}`);
} catch (err) {
  console.error("✖ Error:", err.message);
  process.exit(1);
}
