#!/usr/bin/env python3
"""
Upload dataset_synthetic_100.json tickets to S3, one file per ticket.
Path: s3://internal-testing-1/coimbatore/{yyyy-mm-dd}/{ticket_id}.json
Example: https://internal-testing-1.s3.us-east-1.amazonaws.com/coimbatore/2026-03-02/a1b2c3d4-0031-4000-aa00-000000000031.json
"""

import json
import os
from pathlib import Path
from datetime import datetime

import boto3


BUCKET = "internal-testing-1"
PREFIX = "coimbatore"
DATASET_PATH = Path(__file__).resolve().parent / "dataset" / "dataset_synthetic_100.json"
# Set EXPECTED_BUCKET_OWNER to your AWS account ID to verify bucket ownership on every call.
EXPECTED_BUCKET_OWNER = os.environ.get("EXPECTED_BUCKET_OWNER", "")


def date_from_created_at(created_at: str) -> str:
    """Parse created_at to yyyy-mm-dd."""
    # e.g. "2026-03-02T18:00:00+05:30"
    dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    return dt.strftime("%Y-%m-%d")


def s3_key(ticket_id: str, date_str: str) -> str:
    return f"{PREFIX}/{date_str}/{ticket_id}.json"


def main():
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        tickets = json.load(f)

    s3 = boto3.client("s3")
    for ticket in tickets:
        ticket_id = ticket["ticket_id"]
        created_at = ticket.get("created_at")
        if not created_at:
            print(f"Skip (no created_at): {ticket_id}")
            continue
        date_str = date_from_created_at(created_at)
        key = s3_key(ticket_id, date_str)
        body = json.dumps(ticket, indent=2, ensure_ascii=False)
        s3.put_object(
            Bucket=BUCKET,
            Key=key,
            Body=body.encode("utf-8"),
            ContentType="application/json",
            **({"ExpectedBucketOwner": EXPECTED_BUCKET_OWNER} if EXPECTED_BUCKET_OWNER else {}),
        )
        print(f"Uploaded: s3://{BUCKET}/{key}")

    print(f"Done. Uploaded {len(tickets)} tickets.")


if __name__ == "__main__":
    main()