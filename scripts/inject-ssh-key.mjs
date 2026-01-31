
import { EC2InstanceConnectClient, SendSSHPublicKeyCommand } from "@aws-sdk/client-ec2-instance-connect";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import fs from 'fs';
import path from 'path';
import os from 'os';

const client = new EC2InstanceConnectClient({
  region: "us-east-1",
  credentials: {
      accessKeyId: process.env.VALCORE_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.VALCORE_AWS_SECRET_ACCESS_KEY || "",
  },
});

const ec2 = new EC2Client({
  region: "us-east-1",
  credentials: {
      accessKeyId: process.env.VALCORE_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.VALCORE_AWS_SECRET_ACCESS_KEY || "",
  },
});

const INSTANCE_ID = "i-090266632f8662953";
const INSTANCE_OS_USER = "ubuntu";

async function run() {
    try {
        console.log("Fetching Instance Info...");
        const desc = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [INSTANCE_ID] }));
        const instance = desc.Reservations[0].Instances[0];
        const az = instance.Placement.AvailabilityZone;
        console.log(`Instance found in AZ: ${az}`);

        const publicKeyPath = path.join(os.homedir(), ".ssh", "valcore_deploy_key.pub");
        const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

        console.log("Pushing SSH Key via Instance Connect...");
        const command = new SendSSHPublicKeyCommand({
            InstanceId: INSTANCE_ID,
            InstanceOSUser: INSTANCE_OS_USER,
            SSHPublicKey: publicKey,
            AvailabilityZone: az,
        });

        const response = await client.send(command);
        if (response.RequestId) {
             console.log("Success! Key Pushed. You have 60 seconds to SSH.");
             console.log(`ssh -i ~/.ssh/valcore_deploy_key ubuntu@${instance.PublicIpAddress}`);
        } else {
             console.log("Failed to push key.");
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
