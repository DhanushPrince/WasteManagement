import json
import time
import uuid
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import streamlit as st
from strands import Agent, tool
from strands.models import BedrockModel

# ==========================================================
# IST TIMEZONE
# ==========================================================
IST = ZoneInfo("Asia/Kolkata")

# ==========================================================
# DIRECTORIES
# ==========================================================
BASE_DIR = Path("/Users/dhanush/Documents/Dhanush/sutham")
IMAGE_DIR = BASE_DIR / "images"
OUTPUT_PATH = BASE_DIR / "benchmark.json"

IMAGE_DIR.mkdir(parents=True, exist_ok=True)

# ==========================================================
# GLOBAL STORAGE
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
# TOOL
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
        "wall_time_seconds": None,
    }

    COLLECTED_TICKETS.append(ticket)
    return {"status": "success"}


# ==========================================================
# RUN MODEL
# ==========================================================
def run_model(image_bytes: bytes, image_format: str = "png") -> dict:
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
        {"image": {"format": image_format, "source": {"bytes": image_bytes}}},  # ✅ dynamic format
    ])

    elapsed = round(time.time() - start_time, 4)

    if not COLLECTED_TICKETS:
        raise RuntimeError("Model did not call waste_report.")

    ticket = COLLECTED_TICKETS[0]
    ticket["wall_time_seconds"] = elapsed

    return {"ticket": ticket}


# ==========================================================
# PRIORITY & ACTION COLOR HELPERS
# ==========================================================
PRIORITY_COLOR = {"P0": "🔴", "P1": "🟠", "P2": "🟡"}
ACTION_COLOR   = {"DISPATCH_NOW": "🚨", "ADD_TO_ROUTE": "🗺️", "MONITOR": "👁️"}


# ==========================================================
# STREAMLIT UI
# ==========================================================
st.set_page_config(
    page_title="Sutham — Waste Detection",
    page_icon="🗑️",
    layout="centered",
)

st.title("🗑️ Sutham — Waste Hotspot Detection")
st.caption("Upload a waste site image. Nova Pro will analyze and generate a dispatch ticket.")

st.divider()

uploaded_file = st.file_uploader(
    "Upload Image (PNG / JPG)",
    type=["png", "jpg", "jpeg"],
    help="Image will be saved to the images/ directory automatically.",
)

if uploaded_file:
    # ── Show preview ──────────────────────────────────────
    st.image(uploaded_file, caption="Uploaded Image", use_container_width=True)

    # ── Save to images/ dir ───────────────────────────────
    save_path = IMAGE_DIR / uploaded_file.name
    image_bytes = uploaded_file.read()

    # ✅ Detect real MIME format for Bedrock
    ext = uploaded_file.name.rsplit(".", 1)[-1].lower()
    image_format = "jpeg" if ext in ("jpg", "jpeg") else "png"

    save_path.write_bytes(image_bytes)
    st.success(f"✅ Image saved → `{save_path}`")

    st.divider()

    # ── Run detection ─────────────────────────────────────
    if st.button("🚀 Run Waste Detection", use_container_width=True, type="primary"):
        with st.spinner("⏳ Analyzing image with Amazon Nova Pro..."):
            try:
                result = run_model(image_bytes, image_format=image_format)  # ✅ pass format
                ticket = result["ticket"]

                # Save benchmark JSON
                OUTPUT_PATH.write_text(json.dumps(result, indent=2))

            except Exception as exc:
                st.error(f"❌ Detection failed: {exc}")
                st.stop()

        st.success("✅ Ticket Generated!")
        st.divider()

        # ── Ticket display ────────────────────────────────
        st.subheader("📋 Waste Hotspot Ticket")

        col1, col2, col3 = st.columns(3)
        col1.metric("Priority", f"{PRIORITY_COLOR.get(ticket['priority'], '')} {ticket['priority']}")
        col2.metric("Volume", ticket["volume_level"])
        col3.metric("Est. Weight", f"{ticket['estimated_weight_kg']} kg")

        col4, col5, col6 = st.columns(3)
        col4.metric("Action", f"{ACTION_COLOR.get(ticket['action'], '')} {ticket['action']}")
        col5.metric("Vehicle", ticket["vehicle_type"])
        col6.metric("Wall Time", f"{ticket['wall_time_seconds']}s")

        st.divider()

        st.markdown("**🗺️ Location**")
        loc_col1, loc_col2, loc_col3 = st.columns(3)
        loc_col1.info(f"📍 {ticket['area_name']}")
        loc_col2.info(f"Lat: {ticket['lat']}")
        loc_col3.info(f"Lng: {ticket['lng']}")

        st.markdown("**🗂️ Details**")
        det_col1, det_col2, det_col3 = st.columns(3)
        det_col1.write(f"**Waste Type:** {ticket['waste_type']}")
        det_col2.write(f"**Near Sensitive Zone:** {'⚠️ Yes' if ticket['near_sensitive_zone'] else '✅ No'}")
        det_col3.write(f"**After Photo Required:** {'📷 Yes' if ticket['requires_after_photo'] else 'No'}")

        st.markdown("**🪪 Ticket Meta**")
        st.code(f"Ticket ID : {ticket['ticket_id']}\nCreated At: {ticket['created_at']}", language="text")

        st.divider()

        # ── Raw JSON expander ─────────────────────────────
        with st.expander("🔍 View Raw JSON"):
            st.json(ticket)

        # ── Download button ───────────────────────────────
        st.download_button(
            label="⬇️ Download Ticket JSON",
            data=json.dumps(result, indent=2),
            file_name=f"ticket_{ticket['ticket_id'][:8]}.json",
            mime="application/json",
            use_container_width=True,
        )