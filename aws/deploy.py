"""Upload the static game to an existing S3 bucket.

The bucket and public/CloudFront access must be configured separately.
No credentials, bucket policies, or account settings are stored here.
"""

from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE_FILES = [
    "index.html",
    "css/style.css",
    "data/content.js",
    "js/engine.js",
    "js/progress.js",
    "js/ui.js",
    "js/main.js",
]
CONTENT_TYPES = {".html": "text/html", ".css": "text/css", ".js": "text/javascript"}


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload Question Duel static files to an existing S3 bucket.")
    parser.add_argument("--bucket", required=True, help="Existing S3 bucket name")
    parser.add_argument("--region", required=True, help="Bucket region from your AWS account")
    parser.add_argument("--profile", help="Optional named AWS CLI profile")
    parser.add_argument("--dry-run", action="store_true", help="List uploads without contacting AWS")
    args = parser.parse_args()

    missing = [name for name in SITE_FILES if not (ROOT / name).is_file()]
    if missing:
        parser.error("Missing site files: " + ", ".join(missing))

    if args.dry_run:
        for name in SITE_FILES:
            print(f"DRY RUN: {name} -> s3://{args.bucket}/{name}")
        return

    try:
        import boto3
    except ImportError as exc:
        raise SystemExit("Install boto3 first: python -m pip install boto3") from exc

    session = boto3.Session(profile_name=args.profile, region_name=args.region)
    s3 = session.client("s3")
    for name in SITE_FILES:
        suffix = Path(name).suffix
        cache = "no-cache" if suffix == ".html" else "public, max-age=300"
        s3.upload_file(
            str(ROOT / name),
            args.bucket,
            name,
            ExtraArgs={"ContentType": CONTENT_TYPES[suffix] + "; charset=utf-8", "CacheControl": cache},
        )
        print(f"Uploaded s3://{args.bucket}/{name}")


if __name__ == "__main__":
    main()
