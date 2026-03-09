import { NextRequest, NextResponse } from "next/server";
import {
    BedrockRuntimeClient,
    ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

interface AnalyzeRequest {
    imageBase64: string;
    lat: number;
    lng: number;
    areaName: string;
    nearSensitiveZone: boolean;
}

type ImageFormat = "png" | "jpeg";

/** Detect image format from magic bytes. Defaults to png if unknown. */
function detectImageFormat(bytes: Uint8Array): ImageFormat {
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
    if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
    return "png";
}

// ── Mock waste ticket for when AWS creds are unavailable ─────────────────────
function generateMockTicket(
    lat: number,
    lng: number,
    areaName: string,
    nearSensitiveZone: boolean
) {
    return {
        waste_detected: true,
        image_quality: "CLEAR",
        confidence_score: 0.92,
        waste_type: "MIXED",
        volume_level: "MEDIUM",
        estimated_weight_kg: 45,
        area_covered_sqm: 12,
        stagnant_water_detected: false,
        smoke_detected: false,
        medical_waste_detected: false,
        animal_presence: false,
        high_value_recyclables_present: true,
        recyclable_types: ["PET bottles", "cardboard"],
        area_name: areaName,
        lat,
        lng,
        priority: nearSensitiveZone ? "P0" : "P1",
        near_sensitive_zone: nearSensitiveZone,
        action: nearSensitiveZone ? "DISPATCH_NOW" : "ADD_TO_ROUTE",
        vehicle_type: "PICKUP",
        requires_after_photo: true,
        reasoning:
            "Mixed waste pile detected with identifiable plastic bottles and cardboard packaging. " +
            "Moderate volume suggesting accumulation over several days. No hazardous materials visible. " +
            "Recyclable materials can be separated before disposal.",
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as AnalyzeRequest;
        const { imageBase64, lat, lng, areaName, nearSensitiveZone } = body;

        const region = process.env.AWS_DEFAULT_REGION || "us-east-1";
        const bucket = process.env.S3_BUCKET || "internal-testing-1";
        const coimbatorePrefix = (process.env.S3_COIMBATORE_PREFIX || "coimbatore").replace(/\/$/, "");
        const startTime = Date.now();

        const s3Client = new S3Client({ region });

        // Decode base64 to Uint8Array (used for both S3 upload and Bedrock)
        const imageBytes = Uint8Array.from(atob(imageBase64), (c) => c.codePointAt(0) ?? 0);
        const imageFormat = detectImageFormat(imageBytes);
        const imageExt = imageFormat === "jpeg" ? "jpg" : "png";
        const contentType = imageFormat === "jpeg" ? "image/jpeg" : "image/png";

        // Upload image to S3 at s3://<bucket>/images/
        let imageFile = "";
        try {
            const imageKey = `images/${crypto.randomUUID()}.${imageExt}`;
            await s3Client.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key: imageKey,
                    Body: imageBytes,
                    ContentType: contentType,
                })
            );
            imageFile = `s3://${bucket}/${imageKey}`;
        } catch (s3Error) {
            console.error("S3 image upload failed. Check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and S3_BUCKET in .env.local:", s3Error);
        }

        // Try AWS Bedrock; fall back to mock if creds are missing
        let ticket: Record<string, unknown>;

        try {
            const client = new BedrockRuntimeClient({ region });

            const prompt =
                `Inspect the image carefully and produce a JSON object with these exact fields:\n` +
                `waste_detected (boolean), image_quality (CLEAR|BLURRY|OBSTRUCTED|INSUFFICIENT_LIGHT),\n` +
                `confidence_score (0-1), waste_type (ORGANIC|PLASTIC|E_WASTE|C_D_WASTE|MIXED|OTHER),\n` +
                `volume_level (LOW|MEDIUM|HIGH|CRITICAL), estimated_weight_kg (number),\n` +
                `area_covered_sqm (number), stagnant_water_detected (bool), smoke_detected (bool),\n` +
                `medical_waste_detected (bool), animal_presence (bool),\n` +
                `high_value_recyclables_present (bool), recyclable_types (string[]),\n` +
                `priority (P0|P1|P2), action (DISPATCH_NOW|ADD_TO_ROUTE|MONITOR),\n` +
                `vehicle_type (E_RICKSHAW|PICKUP|COMPACTOR|OTHER), requires_after_photo (bool),\n` +
                `reasoning (string explaining your analysis).\n\n` +
                `GPS (from EXIF - authoritative, do not change):\n` +
                `  lat=${lat}, lng=${lng}\n` +
                `  area_name="${areaName}"\n` +
                `  near_sensitive_zone=${nearSensitiveZone}\n\n` +
                `Return ONLY the JSON object, no markdown fences, no extra text.`;

            const command = new ConverseCommand({
                modelId: "amazon.nova-pro-v1:0",
                messages: [
                    {
                        role: "user",
                        content: [
                            { text: prompt },
                            {
                                image: {
                                    format: imageFormat,
                                    source: { bytes: imageBytes },
                                },
                            },
                        ],
                    },
                ],
                inferenceConfig: {
                    maxTokens: 4096,
                    temperature: 0.2,
                },
            });

            const response = await client.send(command);
            const outputText =
                response.output?.message?.content?.[0]?.text || "{}";

            // Parse JSON from response (handle possible markdown fences)
            const jsonStr = outputText.replaceAll(/```json\n?/g, "").replaceAll(/```\n?/g, "").trim();
            ticket = JSON.parse(jsonStr);

            // Override GPS fields to be authoritative
            ticket.lat = lat;
            ticket.lng = lng;
            ticket.area_name = areaName;
            ticket.near_sensitive_zone = nearSensitiveZone;
        } catch (bedrockError) {
            console.warn("Bedrock call failed, using mock data:", bedrockError);
            ticket = generateMockTicket(lat, lng, areaName, nearSensitiveZone);
        }

        const elapsed = Math.round(Date.now() - startTime) / 1000;
        ticket.wall_time_seconds = elapsed;

        // Add metadata
        ticket.ticket_id = crypto.randomUUID();
        ticket.created_at = new Date().toISOString();
        ticket.image_file = imageFile;

        // Save ticket JSON to S3: coimbatore/YYYY-MM-DD/<ticket_id>.json
        try {
            const dateFolder = new Date().toISOString().slice(0, 10); // e.g. 2026-03-02
            const jsonKey = `${coimbatorePrefix}/${dateFolder}/${ticket.ticket_id as string}.json`;
            const jsonBody = JSON.stringify(ticket, null, 2);
            await s3Client.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key: jsonKey,
                    Body: jsonBody,
                    ContentType: "application/json",
                })
            );
        } catch (s3JsonError) {
            console.error("S3 ticket JSON upload failed. Check AWS credentials and S3_COIMBATORE_PREFIX in .env.local:", s3JsonError);
        }

        return NextResponse.json(ticket);
    } catch (e) {
        return NextResponse.json(
            { error: String(e) },
            { status: 500 }
        );
    }
}
