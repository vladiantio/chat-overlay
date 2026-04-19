import { writeFile } from "node:fs/promises";

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
  await writeFile(
    "./src/features/badges/badges.json",
    JSON.stringify({ badges }, null, "\t"),
  );
}

try {
  console.log("Fetching badges from API...");
  const APIData = await getAPIData();
  console.log(`✔ Fetched ${APIData.length} badges.`);

  const transformedResponse = transformResponse(APIData);
  console.log(`✔ Transformed ${transformedResponse.length} entries.`);

  await saveToFS(transformedResponse);
  console.log("✔ Saved to src/features/badges/badges.json");
} catch (err) {
  console.error("✖ Error:", err.message);
  process.exit(1);
}
