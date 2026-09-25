/* Game content only. Each question's scores match the seven answer IDs in its level. */
(function () {
  "use strict";

  function question(id, prompt, best, rival, scores, why, topic) {
    return { id: id, prompt: prompt, best: best, rival: rival, scores: scores, why: why, topic: topic };
  }

  window.GAME_CONTENT = {
    title: "Question Duel",
    subtitle: "Outsmart the cloud bot. Learn why your answer works.",
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
        id: 1, name: "The CD Era", icon: "💿", theme: "Storage begins", enemy: "Dusty Disk", enemyIcon: "📀",
        intro: "Start with familiar storage. Capacity is only one part of choosing the right tool.",
        answers: ["cd", "usb", "hdd", "s3", "glacier", "ebs", "efs"],
        questions: [
          question("1a", "A website needs to keep a 10 MB image as an object. What is the best fit?", "s3", "hdd", [10, 15, 30, 100, 5, 45, 55], "S3 is object storage built for files such as website images; a disk can hold the bytes but is not the same service.", "Object storage"),
          question("1b", "Old project files are rarely opened, and a restore can take hours. Where should the archive go?", "glacier", "hdd", [40, 35, 55, 70, 100, 45, 50], "S3 Glacier Flexible Retrieval is designed for infrequent access when retrieval time can be longer.", "Archive storage"),
          question("1c", "An EC2 instance needs a persistent block volume for database files. Pick its storage.", "ebs", "s3", [0, 10, 40, 20, 0, 100, 55], "EBS is block storage attached to EC2; a physical hard drive is a useful analogy, not the AWS service.", "Block storage"),
          question("1d", "Several Linux servers must read and write the same mounted file system. Which fits?", "efs", "hdd", [0, 10, 25, 45, 0, 30, 100], "EFS provides a shared file system that multiple compute resources can mount.", "Shared files"),
          question("1e", "You must carry a slide deck to a room with no internet connection. Choose a portable option.", "usb", "s3", [65, 100, 80, 45, 5, 25, 20], "A USB drive is simple for carrying a small file offline; cloud storage needs a network connection to retrieve it.", "Offline transfer"),
          question("1f", "A museum wants to hand out a fixed, read-only disc of photos. Which physical medium matches?", "cd", "s3", [100, 65, 65, 35, 15, 10, 10], "A CD is an optical medium suited to a fixed offline copy; it is less flexible for updates.", "Physical media"),
          question("1g", "A desktop needs lots of local space for an offline photo collection. Which is the closest match?", "hdd", "s3", [70, 80, 100, 45, 15, 30, 20], "A 1 TB hard drive gives local capacity, but it does not add cloud sharing or managed backups by itself.", "Local capacity")
        ]
      },
      {
        id: 2, name: "The USB Crossing", icon: "🔌", theme: "Files move", enemy: "Cable Gremlin", enemyIcon: "👾",
        intro: "Move files between people, servers, and regions. The best answer depends on how they are accessed.",
        answers: ["usb", "s3", "efs", "ebs", "cloudfront", "route53", "vpc"],
        questions: [
          question("2a", "A teammate needs to carry files to an offline computer. Which answer works directly?", "usb", "s3", [100, 35, 20, 20, 15, 0, 0], "A USB drive transfers files without a network; S3 is useful once the devices can connect.", "Offline access"),
          question("2b", "A web app stores user-uploaded images as objects. Which AWS service is the best home?", "s3", "cloudfront", [30, 100, 55, 50, 70, 10, 10], "S3 stores the image objects; CloudFront can deliver cached copies from an S3 origin.", "Object storage"),
          question("2c", "Three Linux EC2 instances need one shared, mounted file system. Choose it.", "efs", "s3", [10, 50, 100, 35, 20, 0, 35], "EFS is a shared file system; S3 uses object access rather than a normal shared mount.", "File storage"),
          question("2d", "One EC2 instance needs a persistent block volume. Which service supplies it?", "ebs", "efs", [10, 25, 55, 100, 0, 0, 30], "EBS supplies attachable block volumes for EC2 instances.", "Block storage"),
          question("2e", "Visitors around the world wait for the same site images. What helps deliver cached copies nearby?", "cloudfront", "s3", [15, 70, 30, 20, 100, 40, 25], "CloudFront caches and serves content from edge locations closer to viewers.", "Edge delivery"),
          question("2f", "People type a domain name; which service answers DNS queries for it?", "route53", "cloudfront", [0, 25, 10, 0, 40, 100, 20], "Route 53 is AWS's DNS service; CloudFront delivers content after users reach an endpoint.", "DNS"),
          question("2g", "Your AWS resources need a logically isolated network. What do you create?", "vpc", "efs", [0, 10, 30, 20, 10, 20, 100], "A VPC defines an isolated virtual network for AWS resources.", "Networking")
        ]
      },
      {
        id: 3, name: "Disk Drive Dungeon", icon: "💽", theme: "Data has a shape", enemy: "Query Slime", enemyIcon: "🟣",
        intro: "A disk, database, cache, and archive solve different data problems. Read the workload before choosing.",
        answers: ["hdd", "ebs", "rds", "dynamodb", "elasticache", "s3", "glacier"],
        questions: [
          question("3a", "An offline desktop needs a large local drive for files. What is the direct answer?", "hdd", "ebs", [100, 55, 30, 20, 20, 35, 10], "A hard drive stores local files; EBS plays a block-storage role for EC2 in AWS.", "Local disk"),
          question("3b", "You manage a database on EC2 and need a persistent block volume under it. Pick the volume.", "ebs", "rds", [40, 100, 70, 20, 15, 20, 0], "EBS gives your self-managed database a block volume; RDS is the alternative when you want a managed relational database.", "Database storage"),
          question("3c", "An orders app needs a relational database and SQL joins. Which managed service fits?", "rds", "dynamodb", [20, 35, 100, 35, 20, 10, 0], "RDS manages relational database engines; DynamoDB uses a different NoSQL data model.", "Relational data"),
          question("3d", "A game stores player profiles by ID using key-value access at scale. Pick the database.", "dynamodb", "rds", [10, 20, 70, 100, 45, 30, 0], "DynamoDB is a managed NoSQL database suited to key-value access patterns.", "Key-value data"),
          question("3e", "The same popular query is read again and again. What can cache its result in memory?", "elasticache", "dynamodb", [10, 20, 45, 60, 100, 20, 0], "ElastiCache is an in-memory cache that can reduce repeated reads from a primary database.", "Caching"),
          question("3f", "You need durable object copies of daily backup files. Where do the files go?", "s3", "glacier", [30, 35, 30, 25, 10, 100, 70], "S3 stores backup objects; an S3 Glacier class is a further choice when restores can wait.", "Backups"),
          question("3g", "Backups will sit for years and slow retrieval is acceptable. Which class fits best?", "glacier", "s3", [25, 30, 20, 20, 5, 70, 100], "S3 Glacier Flexible Retrieval trades retrieval speed for archive-oriented storage.", "Archives")
        ]
      },
      {
        id: 4, name: "Server Room", icon: "🖥️", theme: "Work gets done", enemy: "Traffic Troll", enemyIcon: "👹",
        intro: "Compute, scaling, routing, and monitoring are teammates. Pick the one that directly solves the prompt.",
        answers: ["ec2", "lambda", "autoscaling", "alb", "apigateway", "cloudwatch", "vpc"],
        questions: [
          question("4a", "You need a configurable virtual server for a long-running custom application. Choose it.", "ec2", "autoscaling", [100, 30, 60, 30, 20, 10, 25], "EC2 gives you virtual servers; Auto Scaling can later adjust how many EC2 instances run.", "Virtual servers"),
          question("4b", "A file upload should trigger a short piece of code without managing a server. Choose it.", "lambda", "ec2", [55, 100, 30, 10, 45, 10, 5], "Lambda runs event-driven code; EC2 can run code too, but you manage the server.", "Event-driven compute"),
          question("4c", "The number of EC2 instances should grow and shrink with demand. Which service handles the group?", "autoscaling", "ec2", [60, 40, 100, 50, 20, 45, 25], "EC2 Auto Scaling changes the desired instance capacity of an Auto Scaling group.", "Scaling"),
          question("4d", "HTTP requests should be distributed across several application targets. Pick the router.", "alb", "apigateway", [50, 20, 60, 100, 65, 30, 20], "An Application Load Balancer spreads HTTP and HTTPS requests across healthy targets.", "Load balancing"),
          question("4e", "A team wants a managed front door for its API endpoints. Which service fits most directly?", "apigateway", "alb", [40, 65, 20, 70, 100, 20, 20], "API Gateway helps create and manage APIs; an ALB can route HTTP traffic but is a different tool.", "APIs"),
          question("4f", "You need metrics, logs, and alarms to see what your app is doing. Choose visibility.", "cloudwatch", "autoscaling", [25, 25, 35, 30, 25, 100, 20], "CloudWatch provides metrics, logs, and alarms for observing workloads.", "Monitoring"),
          question("4g", "Your servers need a logically isolated AWS network. Which service defines it?", "vpc", "ec2", [35, 10, 20, 20, 20, 15, 100], "A VPC supplies the network boundary in which resources such as EC2 instances run.", "Network boundary")
        ]
      },
      {
        id: 5, name: "Cloud Control", icon: "☁️", theme: "Guard and automate", enemy: "Permission Phantom", enemyIcon: "👻",
        intro: "Secure access, manage keys, filter web traffic, and connect serverless pieces.",
        answers: ["iam", "kms", "waf", "lambda", "apigateway", "dynamodb", "cloudwatch"],
        questions: [
          question("5a", "Decide which application role may read an S3 bucket. What controls permissions?", "iam", "kms", [100, 40, 20, 10, 10, 5, 15], "IAM policies and roles control access to AWS resources; KMS concerns encryption keys.", "Permissions"),
          question("5b", "Your app needs managed keys for a supported encryption workflow. Choose the key service.", "kms", "iam", [50, 100, 15, 10, 10, 20, 20], "KMS manages encryption keys; IAM controls who can use them.", "Encryption keys"),
          question("5c", "A public web app needs rules to filter suspicious HTTP requests. Choose the filter.", "waf", "cloudwatch", [15, 15, 100, 10, 30, 5, 35], "AWS WAF inspects web requests and applies rules to supported resources.", "Web protection"),
          question("5d", "Run a short function when a new event arrives, without managing a server. Choose compute.", "lambda", "apigateway", [10, 10, 10, 100, 65, 25, 20], "Lambda runs code in response to events; API Gateway can be one way to invoke it through an API.", "Serverless compute"),
          question("5e", "Expose and manage an API for a mobile app. Which service is the API front door?", "apigateway", "lambda", [20, 10, 30, 65, 100, 30, 25], "API Gateway manages API endpoints; Lambda may run code behind them.", "API front door"),
          question("5f", "Store player settings by user ID in a managed NoSQL database. Choose the store.", "dynamodb", "apigateway", [10, 15, 10, 30, 35, 100, 20], "DynamoDB stores key-value or document data; API Gateway only exposes an API.", "NoSQL storage"),
          question("5g", "Watch error metrics and set an alarm when they rise. Which service observes them?", "cloudwatch", "waf", [20, 15, 35, 20, 20, 30, 100], "CloudWatch collects metrics and can trigger alarms; WAF filters web requests.", "Alarms")
        ]
      },
      {
        id: 6, name: "The Global Grid", icon: "🌐", theme: "Final architecture", enemy: "Latency Leviathan", enemyIcon: "🐉",
        intro: "The final duel combines delivery, routing, scaling, storage, networking, and protection.",
        answers: ["cloudfront", "route53", "alb", "autoscaling", "s3", "vpc", "waf"],
        questions: [
          question("6a", "A global audience needs site images cached near viewers. Pick the edge service.", "cloudfront", "s3", [100, 55, 35, 25, 70, 15, 20], "CloudFront uses edge locations for lower-latency delivery; S3 can hold the original images.", "Global delivery"),
          question("6b", "A domain name must resolve to the site's endpoint. Which AWS service handles DNS?", "route53", "cloudfront", [45, 100, 25, 10, 30, 20, 10], "Route 53 is DNS; CloudFront is a content-delivery endpoint it can point to.", "DNS routing"),
          question("6c", "Web requests need spreading across multiple healthy application targets. Choose the balancer.", "alb", "autoscaling", [35, 20, 100, 65, 20, 35, 45], "An ALB routes HTTP and HTTPS requests among targets; Auto Scaling adjusts instance count.", "Traffic distribution"),
          question("6d", "Traffic rises and the EC2 fleet must add instances. Which service changes fleet size?", "autoscaling", "alb", [25, 20, 65, 100, 20, 35, 30], "EC2 Auto Scaling adds or removes instances; an ALB can distribute requests across them.", "Fleet capacity"),
          question("6e", "Static site files need durable object storage as a CloudFront origin. Pick the store.", "s3", "cloudfront", [70, 25, 20, 10, 100, 15, 10], "S3 stores the static objects; CloudFront can deliver them to visitors.", "Static content"),
          question("6f", "Place app resources in a logically isolated network with subnets. Choose the network.", "vpc", "autoscaling", [20, 20, 35, 40, 20, 100, 25], "A VPC defines the virtual network and its subnets; scaling only changes instance count.", "Virtual network"),
          question("6g", "Filter unwanted HTTP requests before they reach the web app. Pick the web firewall.", "waf", "alb", [25, 15, 45, 20, 10, 30, 100], "AWS WAF applies web-request rules; an ALB mainly distributes application traffic.", "Web filtering")
        ]
      }
    ]
  };
}());
