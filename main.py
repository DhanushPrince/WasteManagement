import json
import time
import uuid
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from strands import Agent, tool
from strands.models import BedrockModel

# ==========================================================
# IST TIMEZONE (India Standard Time)
# ==========================================================
IST = ZoneInfo("Asia/Kolkata")

# ==========================================================
# GLOBAL STORAGE (shared with tool)
# ==========================================================
COLLECTED_TICKETS: list[dict] = []

# ==========================================================
# PROMPTS
# ==========================================================
NOVA_SYSTEM = """
You are an expert waste-detection AI.

Analyze the image and call waste_report EXACTLY ONCE.
Do not output any text outside the tool call.
"""

NOVA_USER = """
Inspect the image carefully and call waste_report once.
"""

# ==========================================================
# FUNCTION-BASED TOOL (OFFICIAL STRANDS PATTERN)
# ==========================================================
@tool(
    name="waste_report",
    description="Generate a structured waste hotspot ticket.",
    inputSchema={
        "json": {
            "type": "object",
            "required": [
                "area_name",
                "lat",
                "lng",
                "waste_type",
                "volume_level",
                "estimated_weight_kg",
                "priority",
                "near_sensitive_zone",
                "action",
                "vehicle_type",
                "requires_after_photo",
            ],
            "properties": {
                "area_name": {
                    "type": "string",
                    "description": "Human-readable locality or neighbourhood name inferred from coordinates or image context.",
                },
                "lat": {"type": "number"},
                "lng": {"type": "number"},
                "waste_type": {
                    "type": "string",
                    "enum": ["ORGANIC", "PLASTIC", "E_WASTE", "C_D_WASTE", "MIXED", "OTHER"],
                },
                "volume_level": {
                    "type": "string",
                    "enum": ["LOW", "MEDIUM", "HIGH"],
                },
                "estimated_weight_kg": {"type": "number"},
                "priority": {
                    "type": "string",
                    "enum": ["P0", "P1", "P2"],
                },
                "near_sensitive_zone": {"type": "boolean"},
                "action": {
                    "type": "string",
                    "enum": ["DISPATCH_NOW", "ADD_TO_ROUTE", "MONITOR"],
                },
                "vehicle_type": {
                    "type": "string",
                    "enum": ["E_RICKSHAW", "PICKUP", "COMPACTOR", "OTHER"],
                },
                "requires_after_photo": {"type": "boolean"},
            },
        }
    },
)
def waste_report(
    area_name: str,
    lat: float,
    lng: float,
    waste_type: str,
    volume_level: str,
    estimated_weight_kg: float,
    priority: str,
    near_sensitive_zone: bool,
    action: str,
    vehicle_type: str,
    requires_after_photo: bool,
) -> dict:
    """
    Tool executed by Nova Pro.
    Creates a waste hotspot ticket.
    wall_time_seconds is injected by run_model() after timing completes.
    """

    # Ensure single ticket per run
    COLLECTED_TICKETS.clear()

    ticket = {
        "ticket_id": str(uuid.uuid4()),
        "created_at": datetime.now(IST).isoformat(),
        "area_name": area_name,
        "lat": lat,
        "lng": lng,
        "waste_type": waste_type,
        "volume_level": volume_level,
        "estimated_weight_kg": estimated_weight_kg,
        "priority": priority,
        "near_sensitive_zone": near_sensitive_zone,
        "action": action,
        "vehicle_type": vehicle_type,
        "requires_after_photo": requires_after_photo,
        "wall_time_seconds": None,  # ⏱ patched in after agent returns
    }

    COLLECTED_TICKETS.append(ticket)

    return {"status": "success"}


# ==========================================================
# RUN MODEL
# ==========================================================
def run_model(image_bytes: bytes) -> dict:

    model = BedrockModel(
        model_id="amazon.nova-pro-v1:0",
        region_name="us-east-1",
        temperature=0.2,
        max_tokens=4096,
    )

    agent = Agent(
        model=model,
        tools=[waste_report],
        system_prompt=NOVA_SYSTEM,
    )

    start_time = time.time()

    agent([
        {"text": NOVA_USER},
        {"image": {"format": "png", "source": {"bytes": image_bytes}}},
    ])

    elapsed = round(time.time() - start_time, 4)

    if not COLLECTED_TICKETS:
        raise RuntimeError("Model did not call waste_report.")

    ticket = COLLECTED_TICKETS[0]
    ticket["wall_time_seconds"] = elapsed  # ✅ patch timing into ticket

    return {"ticket": ticket}


# ==========================================================
# MAIN
# ==========================================================
def main():

    IMAGE_PATH = Path("/Users/dhanush/Documents/Dhanush/sutham/image.png")
    OUTPUT_PATH = Path("/Users/dhanush/Documents/Dhanush/sutham/benchmark.json")

    if not IMAGE_PATH.exists():
        raise FileNotFoundError(f"Image not found: {IMAGE_PATH}")

    image_bytes = IMAGE_PATH.read_bytes()

    print("\n⏳ Running Amazon Nova Pro waste detection...\n")

    try:
        result = run_model(image_bytes)
        print("✅ Ticket Generated")
        print(json.dumps(result["ticket"], indent=2))
    except Exception as exc:
        result = {"error": str(exc)}
        print(f"❌ Error: {exc}")

    OUTPUT_PATH.write_text(json.dumps(result, indent=2))
    print(f"\n✅ Results saved → {OUTPUT_PATH}\n")


if __name__ == "__main__":
    main()