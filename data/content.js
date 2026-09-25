/* Game content only. Each question's scores match the seven answer IDs in its level. */
(function () {
  "use strict";

  function question(id, prompt, best, rival, scores, why, topic, support) {
    return { id: id, prompt: prompt, best: best, rival: rival, scores: scores, why: why, topic: topic, support: support || null };
  }

  window.GAME_CONTENT = {
    title: "Question Duel",
    subtitle: "Defeat cloud threats by learning what AWS services really do.",
    rivalName: "PATCHBOT",
    cards: {
      cd: { name: "CD", icon: "💿", type: "physical", tip: "An optical disc can hold a fixed offline copy, but it is small and awkward to update." },
      usb: { name: "USB drive", icon: "🔌", type: "physical", tip: "A USB drive is handy for carrying files offline, but it must be physically shared." },
      hdd: { name: "1 TB hard drive", icon: "💽", type: "physical", tip: "A local hard drive has room for files and database data, but one drive alone is not a managed cloud service." },
      s3: { name: "Amazon S3", icon: "🪣", type: "storage", tip: "S3 stores objects such as images, backups, and static website files in buckets.", docs: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html" },
      glacier: { name: "S3 Glacier Flexible Retrieval", icon: "🧊", type: "storage", tip: "This S3 storage class is for archives that can wait minutes to hours to be restored.", docs: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/glacier-storage-classes.html" },
      ebs: { name: "Amazon EBS", icon: "🧱", type: "storage", tip: "EBS supplies persistent block storage volumes for EC2 instances.", docs: "https://docs.aws.amazon.com/ebs/latest/userguide/what-is-ebs.html" },
      efs: { name: "Amazon EFS", icon: "🗂️", type: "storage", tip: "EFS is a managed file system that multiple Linux compute resources can share.", docs: "https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html" },
      cloudfront: { name: "Amazon CloudFront", icon: "⚡", type: "network", tip: "CloudFront delivers content through edge locations and can cache files near users.", docs: "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html" },
      route53: { name: "Amazon Route 53", icon: "🧭", type: "network", tip: "Route 53 is a DNS service that routes domain names to application endpoints.", docs: "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html" },
      vpc: { name: "Amazon VPC", icon: "🔒", type: "network", tip: "A VPC is a logically isolated network for AWS resources.", docs: "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html" },
      rds: { name: "Amazon RDS", icon: "🧮", type: "database", tip: "RDS helps set up and operate relational databases, including engines that use SQL.", docs: "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html" },
      dynamodb: { name: "Amazon DynamoDB", icon: "🔑", type: "database", tip: "DynamoDB is a managed NoSQL database for key-value and document data.", docs: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html" },
      elasticache: { name: "Amazon ElastiCache", icon: "🚀", type: "database", tip: "ElastiCache keeps frequently used data in memory to reduce repeated backend reads.", docs: "https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html" },
      ec2: { name: "Amazon EC2", icon: "🖥️", type: "compute", tip: "EC2 provides virtual servers that you configure and run in AWS.", docs: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html" },
      lambda: { name: "AWS Lambda", icon: "λ", type: "compute", tip: "Lambda runs code in response to events without managing servers.", docs: "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html" },
      autoscaling: { name: "EC2 Auto Scaling", icon: "📈", type: "compute", tip: "EC2 Auto Scaling adjusts the number of EC2 instances in a group.", docs: "https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html" },
      alb: { name: "Application Load Balancer", icon: "⚖️", type: "network", tip: "An Application Load Balancer distributes HTTP and HTTPS requests across targets.", docs: "https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html" },
      apigateway: { name: "Amazon API Gateway", icon: "🚪", type: "network", tip: "API Gateway creates and manages APIs that expose backend services.", docs: "https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html" },
      cloudwatch: { name: "Amazon CloudWatch", icon: "📊", type: "monitoring", tip: "CloudWatch collects metrics and logs and can trigger alarms for AWS workloads.", docs: "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html" },
      iam: { name: "AWS IAM", icon: "🪪", type: "security", tip: "IAM manages identities and permissions for access to AWS resources.", docs: "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html" },
      kms: { name: "AWS KMS", icon: "🗝️", type: "security", tip: "KMS helps create and manage keys used by supported encryption workflows.", docs: "https://docs.aws.amazon.com/kms/latest/developerguide/overview.html" },
      waf: { name: "AWS WAF", icon: "🛡️", type: "security", tip: "AWS WAF filters HTTP and HTTPS requests reaching supported web resources.", docs: "https://docs.aws.amazon.com/waf/latest/developerguide/what-is-aws-waf.html" }
    },
    levels: [
      {
        id: 1, name: "Cloud Bootcamp", icon: "💿", theme: "AWS essentials", enemy: "Cloud Confuser", enemyIcon: "📀",
        intro: "Meet the core building blocks: files, servers, code, databases, access, delivery, and monitoring.",
        repair: { title: "Restore a simple web app", steps: [
          { id: "cloudwatch", clue: "First, check metrics and alarms to spot the failure." },
          { id: "ec2", clue: "Next, run the replacement virtual server." },
          { id: "s3", clue: "Finally, retrieve the site's stored image objects." }
        ] },
        defense: [
          { prompt: "An unknown identity requests your files. What controls access?", options: ["s3", "iam", "ec2"], best: "iam", why: "IAM manages access permissions." },
          { prompt: "An error alarm fires. What shows app metrics?", options: ["lambda", "rds", "cloudwatch"], best: "cloudwatch", why: "CloudWatch collects metrics and alarms." },
          { prompt: "Site images need object storage. What holds them?", options: ["ec2", "s3", "rds"], best: "s3", why: "S3 stores image objects." }
        ],
        answers: ["s3", "ec2", "lambda", "rds", "iam", "cloudfront", "cloudwatch"],
        questions: [
          question("1a", "A website needs to store uploaded photos. Which service stores the image objects?", "s3", "ec2", [100, 30, 10, 20, 0, 45, 0], "Amazon S3 stores objects such as photos in buckets.", "Store files"),
          question("1b", "You need a virtual server you can configure. Which service provides one?", "ec2", "lambda", [10, 100, 40, 10, 0, 0, 0], "Amazon EC2 provides virtual servers called instances.", "Run servers"),
          question("1c", "An upload should trigger a short function without managing a server. Choose the service.", "lambda", "ec2", [10, 50, 100, 0, 0, 0, 10], "AWS Lambda runs code in response to events without managing servers.", "Run code"),
          question("1d", "An orders app needs a managed relational database. What fits?", "rds", "s3", [20, 20, 10, 100, 0, 0, 10], "Amazon RDS helps operate relational databases.", "Database"),
          question("1e", "Who can read an AWS resource? Choose the service for permissions.", "iam", "cloudwatch", [0, 0, 0, 0, 100, 0, 20], "AWS IAM manages identities and access permissions.", "Access"),
          question("1f", "Global visitors need website content delivered from nearby edge locations. Pick the service.", "cloudfront", "s3", [60, 10, 10, 0, 0, 100, 10], "CloudFront delivers content through edge locations and can cache copies near viewers.", "Delivery"),
          question("1g", "You want metrics and alarms to spot an unhealthy app. Which service helps?", "cloudwatch", "ec2", [0, 20, 20, 0, 0, 0, 100], "CloudWatch collects metrics and can raise alarms.", "Observe"),
          question("1h", "A team wants to host a long-running application on a configurable AWS machine. Choose it.", "ec2", "rds", [10, 100, 45, 25, 0, 0, 15], "EC2 is the virtual server; RDS is for relational databases.", "Compute"),
          question("1i", "A developer needs a place for static site files before delivering them worldwide. Pick the store.", "s3", "cloudfront", [100, 5, 0, 0, 0, 65, 0], "S3 can store static site objects while CloudFront delivers them.", "Website files"),
          question("1j", "A new teammate should get only the AWS permissions required for their job. What manages that?", "iam", "cloudwatch", [0, 0, 0, 0, 100, 0, 15], "IAM policies grant permissions to identities and roles.", "Least privilege")
        ]
      },
      {
        id: 2, name: "Connected Cloud", icon: "🔌", theme: "Networks and traffic", enemy: "Cable Gremlin", enemyIcon: "👾",
        intro: "Learn how apps connect: networks, domain names, APIs, traffic distribution, and global delivery.",
        repair: { title: "Reconnect a busy website", steps: [
          { id: "route53", clue: "First, resolve the site's domain name." },
          { id: "alb", clue: "Next, distribute HTTP requests among targets." },
          { id: "autoscaling", clue: "Finally, adjust the EC2 fleet as demand changes." }
        ] },
        defense: [
          { prompt: "App resources need a private virtual network. Choose it.", options: ["vpc", "s3", "route53"], best: "vpc", why: "VPC defines a logically isolated network." },
          { prompt: "Worldwide users wait on images. Choose edge caching.", options: ["alb", "cloudfront", "vpc"], best: "cloudfront", why: "CloudFront can cache content near users." },
          { prompt: "A mobile app needs a managed API front door. Choose it.", options: ["route53", "s3", "apigateway"], best: "apigateway", why: "API Gateway creates and manages APIs." }
        ],
        answers: ["vpc", "route53", "cloudfront", "alb", "apigateway", "s3", "autoscaling"],
        questions: [
          question("2a", "Your AWS resources need a logically isolated virtual network. What do you create?", "vpc", "route53", [100, 20, 0, 20, 0, 0, 0], "A VPC defines a logically isolated network for AWS resources.", "Virtual network"),
          question("2b", "People type a domain name. Which service answers the DNS query?", "route53", "cloudfront", [0, 100, 40, 0, 0, 0, 0], "Route 53 is AWS's DNS service.", "DNS"),
          question("2c", "Visitors far away need cached copies of site images nearby. Pick edge delivery.", "cloudfront", "s3", [0, 20, 100, 20, 0, 65, 0], "CloudFront can cache and deliver content from edge locations.", "Global delivery"),
          question("2d", "HTTP requests must be spread across several application targets. Choose the balancer.", "alb", "autoscaling", [10, 10, 35, 100, 50, 0, 65], "An Application Load Balancer distributes HTTP and HTTPS requests across targets.", "Load balancing"),
          question("2e", "A mobile app needs a managed front door for its API. Pick the service.", "apigateway", "alb", [0, 20, 20, 70, 100, 0, 0], "API Gateway creates and manages APIs for backend services.", "APIs"),
          question("2f", "Traffic rises and the EC2 fleet should add instances. Which service adjusts the fleet?", "autoscaling", "alb", [0, 0, 20, 65, 0, 0, 100], "EC2 Auto Scaling changes the number of EC2 instances in a group.", "Scaling"),
          question("2g", "A website needs a home for its image files. What stores the original objects?", "s3", "cloudfront", [0, 0, 70, 0, 0, 100, 0], "S3 stores the original files; CloudFront can deliver cached copies.", "Origin storage"),
          question("2h", "An app needs subnets and network routing for its AWS resources. Start with what?", "vpc", "route53", [100, 20, 0, 20, 0, 0, 0], "A VPC is the virtual network where you define subnets and routing.", "Networking"),
          question("2i", "Users should reach an app by its domain name. Which service provides DNS?", "route53", "alb", [0, 100, 20, 35, 20, 0, 0], "Route 53 can resolve the domain name to the application endpoint.", "Names"),
          question("2j", "A busy site has enough servers but requests pile up at one target. What distributes them?", "alb", "autoscaling", [0, 0, 20, 100, 30, 0, 55], "An ALB routes requests among healthy application targets.", "Traffic")
        ]
      },
      {
        id: 3, name: "Disk Drive Dungeon", icon: "💽", theme: "Data has a shape", enemy: "Query Slime", enemyIcon: "🟣",
        intro: "A disk, database, cache, and archive solve different data problems. Read the workload before choosing.",
        repair: { title: "Rebuild a data path", steps: [
          { id: "rds", clue: "First, restore the relational data source." },
          { id: "elasticache", clue: "Next, cache frequently read data in memory." },
          { id: "s3", clue: "Finally, keep backup files as objects." }
        ] },
        defense: [
          { prompt: "Orders use SQL joins. Which managed database fits?", options: ["rds", "s3", "elasticache"], best: "rds", why: "RDS runs relational database engines." },
          { prompt: "Profiles need key-value lookup. Choose the NoSQL store.", options: ["ebs", "dynamodb", "rds"], best: "dynamodb", why: "DynamoDB supports key-value data." },
          { prompt: "Old backups can wait to be restored. Choose an archive class.", options: ["s3", "elasticache", "glacier"], best: "glacier", why: "S3 Glacier Flexible Retrieval is for infrequently accessed archives." }
        ],
        answers: ["hdd", "ebs", "rds", "dynamodb", "elasticache", "s3", "glacier"],
        questions: [
          question("3a", "An offline desktop needs a large local drive for files. What is the direct answer?", "hdd", "ebs", [100, 55, 30, 20, 20, 35, 10], "A hard drive stores local files; EBS plays a block-storage role for EC2 in AWS.", "Local disk"),
          question("3b", "You manage a database on EC2 and need a persistent block volume under it. Pick the volume.", "ebs", "rds", [40, 100, 70, 20, 15, 20, 0], "EBS gives your self-managed database a block volume; RDS is the alternative when you want a managed relational database.", "Database storage"),
          question("3c", "An orders app needs a relational database and SQL joins. Which managed service fits?", "rds", "dynamodb", [20, 35, 100, 35, 20, 10, 0], "RDS manages relational database engines; DynamoDB uses a different NoSQL data model.", "Relational data"),
          question("3d", "A game stores player profiles by ID using key-value access at scale. Pick the database.", "dynamodb", "rds", [10, 20, 70, 100, 45, 30, 0], "DynamoDB is a managed NoSQL database suited to key-value access patterns.", "Key-value data"),
          question("3e", "The same popular query is read again and again. What can cache its result in memory?", "elasticache", "dynamodb", [10, 20, 45, 60, 100, 20, 0], "ElastiCache is an in-memory cache that can reduce repeated reads from a primary database.", "Caching"),
          question("3f", "You need durable object copies of daily backup files. Where do the files go?", "s3", "glacier", [30, 35, 30, 25, 10, 100, 70], "S3 stores backup objects; an S3 Glacier class is a further choice when restores can wait.", "Backups"),
          question("3g", "Backups will sit for years and slow retrieval is acceptable. Which class fits best?", "glacier", "s3", [25, 30, 20, 20, 5, 70, 100], "S3 Glacier Flexible Retrieval trades retrieval speed for archive-oriented storage.", "Archives"),
          question("3h", "A shopping app needs tables with relationships and SQL queries. Pick the managed database.", "rds", "dynamodb", [10, 20, 100, 40, 30, 10, 0], "RDS is a managed relational database choice for SQL data.", "SQL data"),
          question("3i", "A game looks up a player's inventory by ID at high scale. Which NoSQL store fits?", "dynamodb", "rds", [10, 10, 65, 100, 40, 10, 0], "DynamoDB supports key-value and document access patterns.", "NoSQL access"),
          question("3j", "Popular product data is read repeatedly. What helps reduce reads from the main database?", "elasticache", "rds", [0, 10, 65, 50, 100, 0, 0], "ElastiCache can keep frequently read data in memory.", "Caching")
        ]
      },
      {
        id: 4, name: "Server Room", icon: "🖥️", theme: "Work gets done", enemy: "Traffic Troll", enemyIcon: "👹",
        intro: "Compute, scaling, routing, and monitoring are teammates. Pick the one that directly solves the prompt.",
        repair: { title: "Recover a busy application", steps: [
          { id: "cloudwatch", clue: "First, find the traffic spike in metrics." },
          { id: "autoscaling", clue: "Next, adjust the number of EC2 instances." },
          { id: "alb", clue: "Finally, spread HTTP requests among targets." }
        ] },
        defense: [
          { prompt: "EC2 instance count must grow with demand. Choose it.", options: ["ec2", "autoscaling", "vpc"], best: "autoscaling", why: "EC2 Auto Scaling adjusts instance count." },
          { prompt: "HTTP requests need healthy targets. Choose the balancer.", options: ["apigateway", "cloudwatch", "alb"], best: "alb", why: "An ALB distributes HTTP and HTTPS requests." },
          { prompt: "Error metrics need an alarm. Choose visibility.", options: ["cloudwatch", "lambda", "vpc"], best: "cloudwatch", why: "CloudWatch provides metrics and alarms." }
        ],
        answers: ["ec2", "lambda", "autoscaling", "alb", "apigateway", "cloudwatch", "vpc"],
        questions: [
          question("4a", "You need a configurable virtual server for a long-running custom application. Choose it.", "ec2", "autoscaling", [100, 30, 60, 30, 20, 10, 25], "EC2 gives you virtual servers; Auto Scaling can later adjust how many EC2 instances run.", "Virtual servers"),
          question("4b", "A file upload should trigger a short piece of code without managing a server. Choose it.", "lambda", "ec2", [55, 100, 30, 10, 45, 10, 5], "Lambda runs event-driven code; EC2 can run code too, but you manage the server.", "Event-driven compute"),
          question("4c", "The number of EC2 instances should grow and shrink with demand. Which service handles the group?", "autoscaling", "ec2", [60, 40, 100, 50, 20, 45, 25], "EC2 Auto Scaling changes the desired instance capacity of an Auto Scaling group.", "Scaling"),
          question("4d", "HTTP requests should be distributed across several application targets. Pick the router.", "alb", "apigateway", [50, 20, 60, 100, 65, 30, 20], "An Application Load Balancer spreads HTTP and HTTPS requests across healthy targets.", "Load balancing"),
          question("4e", "A team wants a managed front door for its API endpoints. Which service fits most directly?", "apigateway", "alb", [40, 65, 20, 70, 100, 20, 20], "API Gateway helps create and manage APIs; an ALB can route HTTP traffic but is a different tool.", "APIs"),
          question("4f", "You need metrics, logs, and alarms to see what your app is doing. Choose visibility.", "cloudwatch", "autoscaling", [25, 25, 35, 30, 25, 100, 20], "CloudWatch provides metrics, logs, and alarms for observing workloads.", "Monitoring"),
          question("4g", "Your servers need a logically isolated AWS network. Which service defines it?", "vpc", "ec2", [35, 10, 20, 20, 20, 15, 100], "A VPC supplies the network boundary in which resources such as EC2 instances run.", "Network boundary"),
          question("4h", "A scheduled job runs briefly each day. Which service runs code without a server to manage?", "lambda", "ec2", [55, 100, 30, 10, 35, 10, 0], "Lambda suits short event-driven code; EC2 gives a server to manage.", "Short jobs"),
          question("4i", "Errors are rising but you cannot see when. Which service provides logs and alarms?", "cloudwatch", "ec2", [20, 20, 20, 20, 20, 100, 0], "CloudWatch gathers logs and metrics and can raise alarms.", "Visibility"),
          question("4j", "A web app needs more EC2 instances during busy hours and fewer later. Pick the fleet controller.", "autoscaling", "alb", [60, 30, 100, 65, 20, 35, 20], "EC2 Auto Scaling adjusts instance count; ALB spreads requests across targets.", "Capacity")
        ]
      },
      {
        id: 5, name: "Cloud Control", icon: "☁️", theme: "Guard and automate", enemy: "Permission Phantom", enemyIcon: "👻",
        intro: "Secure access, manage keys, filter web traffic, and connect serverless pieces.",
        repair: { title: "Restore a secured API", steps: [
          { id: "iam", clue: "First, review who is allowed to access resources." },
          { id: "waf", clue: "Next, filter unwanted HTTP requests." },
          { id: "cloudwatch", clue: "Finally, watch error metrics and alarms." }
        ] },
        defense: [
          { prompt: "A role has too much access. Which service controls permissions?", options: ["kms", "iam", "waf"], best: "iam", why: "IAM policies control permissions." },
          { prompt: "Unwanted HTTP requests reach your app. Choose the web filter.", options: ["cloudwatch", "waf", "iam"], best: "waf", why: "AWS WAF filters web requests." },
          { prompt: "You need to manage encryption keys. Choose the key service.", options: ["kms", "iam", "dynamodb"], best: "kms", why: "KMS manages keys for supported encryption workflows." }
        ],
        answers: ["iam", "kms", "waf", "lambda", "apigateway", "dynamodb", "cloudwatch"],
        questions: [
          question("5a", "Decide which application role may read an S3 bucket. What controls permissions?", "iam", "kms", [100, 40, 20, 10, 10, 5, 15], "IAM policies and roles control access to AWS resources; KMS concerns encryption keys.", "Permissions"),
          question("5b", "Your app needs managed keys for a supported encryption workflow. Choose the key service.", "kms", "iam", [50, 100, 15, 10, 10, 20, 20], "KMS manages encryption keys; IAM controls who can use them.", "Encryption keys"),
          question("5c", "A public web app needs rules to filter suspicious HTTP requests. Choose the filter.", "waf", "cloudwatch", [15, 15, 100, 10, 30, 5, 35], "AWS WAF inspects web requests and applies rules to supported resources.", "Web protection"),
          question("5d", "An API request should run code without a server to manage. Which service runs the code?", "lambda", "apigateway", [10, 10, 10, 100, 65, 25, 20], "Lambda runs the code; API Gateway can receive the request and invoke it.", "Serverless compute", "apigateway"),
          question("5e", "Expose and manage an API for a mobile app. Which service is the API front door?", "apigateway", "lambda", [20, 10, 30, 65, 100, 30, 25], "API Gateway manages API endpoints; Lambda may run code behind them.", "API front door"),
          question("5f", "Store player settings by user ID in a managed NoSQL database. Choose the store.", "dynamodb", "apigateway", [10, 15, 10, 30, 35, 100, 20], "DynamoDB stores key-value or document data; API Gateway only exposes an API.", "NoSQL storage"),
          question("5g", "Watch error metrics and set an alarm when they rise. Which service observes them?", "cloudwatch", "waf", [20, 15, 35, 20, 20, 30, 100], "CloudWatch collects metrics and can trigger alarms; WAF filters web requests.", "Alarms"),
          question("5h", "A role must be allowed to call a protected AWS API. Which service grants permission?", "iam", "apigateway", [100, 30, 10, 10, 40, 10, 10], "IAM policies determine permissions for AWS identities and roles.", "Authorization"),
          question("5i", "Security wants to control the encryption keys used by an AWS workload. Choose the key manager.", "kms", "iam", [50, 100, 10, 0, 0, 10, 10], "KMS manages keys used by supported AWS encryption workflows.", "Encryption"),
          question("5j", "A web endpoint is flooded with suspicious HTTP requests. Which service filters those requests?", "waf", "cloudwatch", [10, 10, 100, 0, 40, 0, 35], "AWS WAF applies rules to web requests reaching supported resources.", "Web traffic")
        ]
      },
      {
        id: 6, name: "The Global Grid", icon: "🌐", theme: "Final architecture", enemy: "Latency Leviathan", enemyIcon: "🐉",
        intro: "The final duel combines delivery, routing, scaling, storage, networking, and protection.",
        repair: { title: "Reconnect a global static site", steps: [
          { id: "route53", clue: "First, resolve the visitor's domain name." },
          { id: "cloudfront", clue: "Next, deliver cached content from edge locations." },
          { id: "s3", clue: "Finally, reach the original stored site objects when needed." }
        ] },
        defense: [
          { prompt: "A global audience needs nearby cached images. Choose it.", options: ["s3", "cloudfront", "alb"], best: "cloudfront", why: "CloudFront caches content near viewers." },
          { prompt: "The EC2 fleet needs more instances. Choose the scaler.", options: ["route53", "autoscaling", "vpc"], best: "autoscaling", why: "EC2 Auto Scaling adjusts fleet size." },
          { prompt: "Suspicious HTTP requests need filtering. Choose it.", options: ["alb", "s3", "waf"], best: "waf", why: "AWS WAF applies web-request rules." }
        ],
        answers: ["cloudfront", "route53", "alb", "autoscaling", "s3", "vpc", "waf"],
        questions: [
          question("6a", "A global audience needs site images cached near viewers. Pick the edge service.", "cloudfront", "s3", [100, 55, 35, 25, 70, 15, 20], "CloudFront uses edge locations for lower-latency delivery; S3 can hold the original images.", "Global delivery"),
          question("6b", "A domain name must resolve to the site's endpoint. Which AWS service handles DNS?", "route53", "cloudfront", [45, 100, 25, 10, 30, 20, 10], "Route 53 is DNS; CloudFront is a content-delivery endpoint it can point to.", "DNS routing"),
          question("6c", "Web requests need spreading across multiple healthy application targets. Choose the balancer.", "alb", "autoscaling", [35, 20, 100, 65, 20, 35, 45], "An ALB routes HTTP and HTTPS requests among targets; Auto Scaling adjusts instance count.", "Traffic distribution"),
          question("6d", "Traffic rises and the EC2 fleet must add instances. Which service changes fleet size?", "autoscaling", "alb", [25, 20, 65, 100, 20, 35, 30], "EC2 Auto Scaling adds or removes instances; an ALB can distribute requests across them.", "Fleet capacity", "alb"),
          question("6e", "Static site files need durable object storage as a CloudFront origin. Pick the store.", "s3", "cloudfront", [70, 25, 20, 10, 100, 15, 10], "S3 stores the static objects; CloudFront can deliver them to visitors.", "Static content"),
          question("6f", "Place app resources in a logically isolated network with subnets. Choose the network.", "vpc", "autoscaling", [20, 20, 35, 40, 20, 100, 25], "A VPC defines the virtual network and its subnets; scaling only changes instance count.", "Virtual network"),
          question("6g", "Filter unwanted HTTP requests before they reach the web app. Pick the web firewall.", "waf", "alb", [25, 15, 45, 20, 10, 30, 100], "AWS WAF applies web-request rules; an ALB mainly distributes application traffic.", "Web filtering"),
          question("6h", "A growing EC2 group needs requests shared among healthy web targets. What routes the requests?", "alb", "autoscaling", [30, 20, 100, 70, 20, 20, 20], "An ALB distributes application requests; Auto Scaling controls instance count.", "Resilience"),
          question("6i", "A marketing page serves the same images worldwide. Which service caches them near users?", "cloudfront", "s3", [100, 30, 20, 10, 70, 10, 0], "CloudFront can cache copies at edge locations near viewers.", "Edge caching"),
          question("6j", "The app's domain must resolve to its public endpoint. Choose the DNS service.", "route53", "cloudfront", [45, 100, 20, 10, 20, 0, 0], "Route 53 provides DNS for domain names and endpoints.", "DNS")
        ]
      }
    ]
  };
}());
