/**
 * Vite plugin: GET /api/dataset → fetch from S3 (default: internal-testing-1/coimbatore/).
 * Uses single file coimbatore/dataset.json if present, else aggregates coimbatore/date/ticket_id.json.
 * Uses AWS credentials from env (exported in terminal or from .env with override: false).
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const cacheDir = join(projectRoot, ".s3-cache");

// Ensure cache directory exists
if (!existsSync(cacheDir)) {
  mkdirSync(cacheDir, { recursive: true });
}

async function loadEnv() {
  const envPath = join(projectRoot, ".env");
  const fallbackPath = join(projectRoot, "..", "ecoroute", ".env");
  try {
    const dotenv = await import("dotenv");
    if (existsSync(envPath)) dotenv.config({ path: envPath, override: false });
    else if (existsSync(fallbackPath)) dotenv.config({ path: fallbackPath, override: false });
    const exportKeys = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "AWS_REGION"];
    for (const key of exportKeys) {
      const exportKey = `export ${key}`;
      if (process.env[exportKey] && !process.env[key]) process.env[key] = process.env[exportKey];
    }
  } catch (error) {
    console.warn("Failed to load environment variables:", error);
  }
}

const MIMES = { jpeg: "image/jpeg", jpg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build an S3Client from environment variables. */
function buildS3Client(S3Client) {
  const region = process.env.AWS_REGION || "us-east-1";
  const credentials =
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
      }
      : undefined;
  return new S3Client({ region, ...(credentials && { credentials }) });
}

/**
 * List all .json keys under prefix (multi-page) then download and merge them.
 * Returns the parsed dataset array (or object).
 */
async function fetchDatasetFromS3(s3, { ListObjectsV2Command, GetObjectCommand }, bucket, prefix) {
  // 1. Paginate listing
  const jsonKeys = [];
  let continuationToken;
  do {
    const list = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken })
    );
    const page = (list.Contents || []).map((o) => o.Key).filter((k) => k?.toLowerCase().endsWith(".json"));
    jsonKeys.push(...page);
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  if (jsonKeys.length === 0) return null; // caller handles 404

  // 2. Prefer a single dataset file
  const singleKey =
    jsonKeys.find((k) => k === `${prefix}dataset.json` || k.toLowerCase().endsWith("/dataset.json")) ||
    jsonKeys.find((k) => k.toLowerCase().includes("dataset_synthetic"));

  if (singleKey) {
    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: singleKey }));
    const body = await obj.Body.transformToString();
    console.log("[S3 dataset] bucket:", bucket, "file:", singleKey);
    return { data: JSON.parse(body), key: singleKey };
  }

  // 3. Aggregate per-ticket files
  const results = [];
  for (const key of jsonKeys) {
    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = await obj.Body.transformToString();
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) results.push(...parsed);
    else if (parsed && typeof parsed === "object") results.push(parsed);
  }
  console.log("[S3 dataset] bucket:", bucket, "aggregated:", jsonKeys.length, "files under", prefix);
  return { data: results, key: prefix };
}

/** Handle GET /api/dataset */
async function handleDatasetRequest(res) {
  const datasetCachePath = join(cacheDir, "dataset.json");
  if (existsSync(datasetCachePath)) {
    console.log("[S3 dataset] Serving dataset from local cache");
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.end(readFileSync(datasetCachePath, "utf-8"));
    return;
  }

  await loadEnv();
  const s3Sdk = await import("@aws-sdk/client-s3");
  const bucket = process.env.S3_BUCKET || "internal-testing-1";
  const prefix = (process.env.S3_INPUT_PREFIX || "coimbatore/").replace(/\/?$/, "/");
  const s3 = buildS3Client(s3Sdk.S3Client);

  const result = await fetchDatasetFromS3(s3, s3Sdk, bucket, prefix);
  if (!result) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: `No .json in s3://${bucket}/${prefix}` }));
    return;
  }

  const responseText = JSON.stringify(result.data);
  try {
    writeFileSync(datasetCachePath, responseText, "utf-8");
  } catch (error_) {
    console.warn("[S3 dataset] Could not save to cache:", error_);
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-S3-Bucket", bucket);
  res.setHeader("X-S3-Key", result.key);
  res.end(responseText);
}

/** Handle GET /api/s3-image?key=<s3-key> */
async function handleImageRequest(res, keyParam) {
  const safeKey = Buffer.from(keyParam).toString("base64url") + "-" + keyParam.split("/").pop();
  const imageCachePath = join(cacheDir, safeKey);
  const ext = keyParam.split(".").pop()?.toLowerCase() || "";
  const contentType = MIMES[ext] || "application/octet-stream";

  if (existsSync(imageCachePath)) {
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.end(readFileSync(imageCachePath));
    return;
  }

  await loadEnv();
  const { GetObjectCommand, S3Client } = await import("@aws-sdk/client-s3");
  const bucket = process.env.S3_BUCKET || "internal-testing-1";
  const s3 = buildS3Client(S3Client);

  console.log("[S3 image] bucket:", bucket, "file:", keyParam);
  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: keyParam }));
  const s3ContentType = obj.ContentType || contentType;
  const bodyBuffer = Buffer.from(await obj.Body.transformToByteArray());

  try {
    writeFileSync(imageCachePath, bodyBuffer);
  } catch (error_) {
    console.warn("[S3 image] Could not save to cache:", error_);
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", s3ContentType);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(bodyBuffer);
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export default function vitePluginS3Dataset() {
  return {
    name: "vite-plugin-s3-dataset",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET") return next();

        const url = req.url?.split("?")[0] || "";
        const q = req.url?.includes("?")
          ? new URLSearchParams(req.url.slice(req.url.indexOf("?") + 1))
          : null;
        const keyParam = q?.get("key");

        if (url === "/api/dataset" || url === "/api/dataset/") {
          try {
            await handleDatasetRequest(res);
          } catch (err) {
            console.error("[vite-plugin-s3-dataset]", err.message);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: String(err.message) }));
          }
          return;
        }

        if (url === "/api/s3-image" && keyParam) {
          try {
            await handleImageRequest(res, keyParam);
          } catch (err) {
            console.error("[vite-plugin-s3-dataset] image:", err.message);
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("Not found");
          }
          return;
        }

        next();
      });
    },
  };
}

