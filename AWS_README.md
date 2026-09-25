# AWS hosting notes

**Status:** the static game is built locally; no AWS resources have been deployed. The exact event dashboard link was opened twice while signed in. Both times it redirected to **Join event**, and the 12-digit access-code field stayed empty. The URL's `utm_medium=qr_code` parameter does not contain the event code. The specific event account and its permissions have not been verified.

## Use the Workshop Studio access

1. Open the [event dashboard](https://catalog.us-east-1.prod.workshops.aws/event/dashboard/en-US?utm_medium=qr_code), sign in with the method supplied by the organizer, and join the event if prompted for an access code.
2. Check the event's **duration/end time**, **accessible Regions**, and **AWS account access** section. If it provides **Open AWS Console**, use that link to work in the event account. Some Workshop Studio events also offer temporary CLI credentials; use those only if this event offers them and the team chooses Python deployment automation. [Workshop Studio overview](https://catalog.workshops.aws/) · [AWS event account walkthrough](https://www.eksworkshop.com/docs/fastpaths/setup/aws-event)
3. In that account, check whether S3 and CloudFront are available and whether the event permits a public demo. Do this early, then return to building the game locally. The account's exact permissions and expiry are event-specific.
4. Keep source code and documentation in [GitHub](https://github.com/A1ndas/AWS-Hackathon). Treat the event account as a place to run the demo, not the only copy of the project. Plan for the hosted URL to stop working if the account expires.

The game simulates AWS architecture decisions. It needs only website hosting resources for the MVP; there is no reason to deploy real EC2, RDS, or the other card services.

## Recommended website setup

If the event account permits it, upload `index.html`, `css/`, `data/`, and `js/` to an S3 bucket, and serve them through Amazon CloudFront. Use the S3 bucket as a regular S3 origin with CloudFront Origin Access Control so the bucket can stay private. Set `index.html` as CloudFront's default root object. AWS documents this pattern in its [secure static website guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/getting-started-secure-static-website-cloudformation-template.html).

For a quick hackathon demo, S3 static website hosting is another option **if the event rules allow public bucket reads**: enable static website hosting, set `index.html` as the index document, allow public reads for the site objects, and open the bucket's website endpoint. That endpoint serves **HTTP only**; use CloudFront if the public site needs HTTPS. Follow the [AWS S3 static website tutorial](https://docs.aws.amazon.com/AmazonS3/latest/userguide/HostingWebsiteOnS3Setup.html) for current console steps. If the event account blocks both routes, demonstrate the local game and arrange approved long-term hosting separately.

## Where Python fits

The website does not require Python to run. `aws/deploy.py` is an optional Python uploader for the seven static site files. It targets an **existing** S3 bucket and does not change bucket access settings. First check the file list without contacting AWS:

```powershell
python aws/deploy.py --bucket YOUR_BUCKET --region YOUR_EVENT_REGION --dry-run
```

When the event account provides CLI credentials and the bucket is ready, install `boto3` and omit `--dry-run` to upload. Keep temporary credentials outside the repository and never put them in browser JavaScript. If the event provides only console access, upload the same files through the S3 console instead.

## Deployment check

After upload, verify that the title screen loads, all CSS and script files load from their folders, each battle continues until seven hits or zero player HP, timed alerts and dodge phases work, progress survives a page refresh, sound can be muted, and no browser console errors appear. The same files should also work when `index.html` is opened locally.
