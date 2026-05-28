import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCb);

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY is missing");

const outPath = resolve("public/og.png");
const rawPath = resolve("public/og.raw.png");

const prompt = `Create a 1200x630 Open Graph social image.
Warm editorial paper aesthetic.
Exact palette: cream background #f4f1ea, dark ink #1a1712, teal #0f766e accent, gold #a98300.
Typography: big refined serif title text exactly: Cash & ARR Studio.
Subtitle text exactly: How big can a subscription app get on a 20k-dollar credit line.
Composition: clean generous negative space, no logos, no brand marks, no watermarks.
Include a minimalist rising line chart climbing up/right to a gold circular marker labeled 1M.
Keep text crisp and readable, editorial magazine cover feel, subtle paper grain, elegant margins.`;

const response = await fetch("https://api.openai.com/v1/images/generations", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "gpt-image-2",
    prompt,
    n: 1,
    size: "1536x1024",
    quality: "high",
    background: "opaque",
    output_format: "png",
  }),
});

const bodyText = await response.text();
if (!response.ok) {
  throw new Error(`OpenAI image request failed (${response.status}): ${bodyText}`);
}

const payload = JSON.parse(bodyText);
const b64 = payload.data?.[0]?.b64_json;
if (!b64) throw new Error(`No b64_json image returned: ${bodyText}`);

await mkdir(dirname(outPath), { recursive: true });
await writeFile(rawPath, Buffer.from(b64, "base64"));

await execFile("magick", [
  rawPath,
  "-resize",
  "1200x630^",
  "-gravity",
  "center",
  "-extent",
  "1200x630",
  outPath,
]);

const { stdout } = await execFile("identify", ["-format", "%w x %h", outPath]);
console.log(`${outPath}: ${stdout}`);
