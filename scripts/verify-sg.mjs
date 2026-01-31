import { EC2Client, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";

const client = new EC2Client({ 
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.VALCORE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.VALCORE_AWS_SECRET_ACCESS_KEY || ""
  }
});

async function verifySG() {
  try {
    const command = new DescribeSecurityGroupsCommand({
      GroupIds: ["sg-03a6f1db96caa8a26"]
    });
    const response = await client.send(command);
    const sg = response.SecurityGroups[0];

    console.log("Security Group:", sg.GroupId);
    console.log("Ingress Rules:");
    sg.IpPermissions.forEach(rule => {
      console.log(`  - Protocol: ${rule.IpProtocol}, Ports: ${rule.FromPort}-${rule.ToPort}, Ranges: ${JSON.stringify(rule.IpRanges)}`);
    });

  } catch (err) {
    console.error("Error:", err);
  }
}

verifySG();
