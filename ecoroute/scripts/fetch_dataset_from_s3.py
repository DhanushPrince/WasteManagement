"""
Fetch dataset JSON from S3 input folder and write to public/dataset.json.
S3 path: s3://internal-testing-1/input/
No HTTP server - run once when you want to refresh data: npm run fetch-s3

Loads AWS credentials from ecoroute_2/.env or ecoroute/.env.
"""

import json
import os
import sys
from pathlib import Path

# Load .env before boto3
project_root = Path(__file__).resolve().parent.parent
env_path = project_root / ".env"
fallback_env = project_root.parent / "ecoroute" / ".env"

try:
    from dotenv import load_dotenv
    if env_path.exists():
        load_dotenv(env_path, override=True)
    else:
        load_dotenv(fallback_env, override=True)
    for key in ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "AWS_REGION"):
        export_key = f"export {key}"
        if os.environ.get(export_key) and not os.environ.get(key):
            os.environ[key] = os.environ[export_key]
except ImportError:
    pass

import boto3

BUCKET = os.environ.get("S3_BUCKET", "internal-testing-1")
INPUT_PREFIX = os.environ.get("S3_INPUT_PREFIX", "input/")
OUTPUT_FILE = project_root / "public" / "dataset.json"
# Set EXPECTED_BUCKET_OWNER to your AWS account ID to verify bucket ownership on every call.
EXPECTED_BUCKET_OWNER = os.environ.get("EXPECTED_BUCKET_OWNER", "")

if not os.environ.get("AWS_ACCESS_KEY_ID"):
    print("Warning: No AWS_ACCESS_KEY_ID in .env. Create ecoroute_2/.env or use ecoroute/.env.", file=sys.stderr)

s3 = boto3.client(
    "s3",
    region_name=os.environ.get("AWS_REGION", "us-east-1"),
)


def get_dataset_from_s3():
    paginator = s3.get_paginator("list_objects_v2")
    paginate_kwargs = {"Bucket": BUCKET, "Prefix": INPUT_PREFIX}
    if EXPECTED_BUCKET_OWNER:
        paginate_kwargs["ExpectedBucketOwner"] = EXPECTED_BUCKET_OWNER
    keys = []
    for page in paginator.paginate(**paginate_kwargs):
        for obj in page.get("Contents") or []:
            k = obj.get("Key")
            if k and k.lower().endswith(".json"):
                keys.append(k)
    key = next((k for k in keys if k.lower().endswith("dataset.json")), keys[0] if keys else None)
    if not key:
        raise FileNotFoundError(f"No .json file found in s3://{BUCKET}/{INPUT_PREFIX}")
    get_kwargs = {"Bucket": BUCKET, "Key": key}
    if EXPECTED_BUCKET_OWNER:
        get_kwargs["ExpectedBucketOwner"] = EXPECTED_BUCKET_OWNER
    resp = s3.get_object(**get_kwargs)
    body = resp["Body"].read().decode("utf-8")
    return json.loads(body)


def main():
    data = get_dataset_from_s3()
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    count = len(data) if isinstance(data, list) else "?"
    print(f"Fetched {count} records from s3://{BUCKET}/{INPUT_PREFIX} -> {OUTPUT_FILE}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
