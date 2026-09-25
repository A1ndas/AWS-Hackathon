"""Upload the built game (the Vite `dist/` folder) to an existing S3 bucket.

Build first with `npm run build`. The bucket and public or CloudFront access must be
configured separately. No credentials, bucket policies, or account settings are stored here.
"""

from __future__ import annotations

import argparse
import mimetypes
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".mp3": "audio/mpeg",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
}


def site_files(dist: Path) -> list[Path]:
    return sorted(path for path in dist.rglob("*") if path.is_file() and not path.name.startswith("."))


def content_type(path: Path) -> str:
    return CONTENT_TYPES.get(path.suffix.lower()) or mimetypes.guess_type(path.name)[0] or "application/octet-stream"


def cache_control(key: str) -> str:
    if key.endswith(".html"):
        return "no-cache"
    if key.startswith("assets/"):
        return "public, max-age=31536000, immutable"  # Vite fingerprints these file names.
    return "public, max-age=300"


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload the built Question Duel site to an existing S3 bucket.")
    parser.add_argument("--bucket", required=True, help="Existing S3 bucket name")
    parser.add_argument("--region", required=True, help="Bucket region from your AWS account")
    parser.add_argument("--profile", help="Optional named AWS CLI profile")
    parser.add_argument("--dist", default="dist", help="Build folder to upload (default: dist)")
    parser.add_argument("--dry-run", action="store_true", help="List uploads without contacting AWS")
    args = parser.parse_args()

    dist = (ROOT / args.dist).resolve()
    if not (dist / "index.html").is_file():
        parser.error(f"No build found in {dist}. Run `npm run build` first.")
    files = site_files(dist)

    if args.dry_run:
        for path in files:
            key = path.relative_to(dist).as_posix()
            print(f"DRY RUN: {key} -> s3://{args.bucket}/{key} ({content_type(path)})")
        return

    try:
        import boto3
    except ImportError as exc:
        raise SystemExit("Install boto3 first: python -m pip install boto3") from exc

    session = boto3.Session(profile_name=args.profile, region_name=args.region)
    s3 = session.client("s3")
    for path in files:
        key = path.relative_to(dist).as_posix()
        s3.upload_file(str(path), args.bucket, key,
                       ExtraArgs={"ContentType": content_type(path), "CacheControl": cache_control(key)})
        print(f"Uploaded s3://{args.bucket}/{key}")


if __name__ == "__main__":
    main()
