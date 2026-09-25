# AWS hosting notes

**Status:** deployment guide for the planned game. There are no site files or AWS resources to deploy yet.

## Recommended website setup

Build the game as static files, upload `index.html`, `css/`, `data/`, and `js/` to an S3 bucket, and serve them through Amazon CloudFront. Use the S3 bucket as a regular S3 origin with CloudFront Origin Access Control so the bucket can stay private. Set `index.html` as CloudFront's default root object. AWS documents this pattern in its [secure static website guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/getting-started-secure-static-website-cloudformation-template.html).

For a quick hackathon demo, S3 static website hosting is another option: enable static website hosting, set `index.html` as the index document, allow public reads for the site objects, and open the bucket's website endpoint. That endpoint serves **HTTP only**; use CloudFront if the public site needs HTTPS. Follow the [AWS S3 static website tutorial](https://docs.aws.amazon.com/AmazonS3/latest/userguide/HostingWebsiteOnS3Setup.html) for current console steps.

## Where Python fits

The website does not require Python to run. If the team wants Python on AWS, use it for deployment automation or a later AWS Lambda API. Keep that work optional until the complete browser game is playable. No AWS credentials belong in browser JavaScript or in this repository.

## Deployment check

After upload, verify that the title screen loads, all CSS and script files load from their folders, five lessons and combats run, progress survives a page refresh, and no browser console errors appear. The same files should also work when `index.html` is opened locally.
