import { EC2Client, CreateSecurityGroupCommand, AuthorizeSecurityGroupIngressCommand, RunInstancesCommand, AllocateAddressCommand, AssociateAddressCommand, DescribeInstancesCommand, CreateKeyPairCommand, TerminateInstancesCommand } from "@aws-sdk/client-ec2";
import fs from 'fs';
import path from 'path';
import os from 'os';

const client = new EC2Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.VALCORE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.VALCORE_AWS_SECRET_ACCESS_KEY || "",
  },
});

const OLD_INSTANCE_ID = "i-090266632f8662953"; // From previous run
const EXISTING_ALLOC_ID = ""; // If you know it, use it. Otherwise, assume new one or query. Wait, I see previous run output: "Elastic IP Allocated: 3.219.195.67". I don't see AllocationId but can find it.
// Actually, I'll just query addresses to find 3.219.195.67 allocId.
import { DescribeAddressesCommand } from "@aws-sdk/client-ec2";

async function provision() {
  try {
    const keyName = `valcore-prod-key-${Date.now()}`;
    console.log(`Creating Key Pair: ${keyName}...`);
    const keyPair = await client.send(new CreateKeyPairCommand({ KeyName: keyName }));
    
    const keyPath = path.join(os.homedir(), ".ssh", `${keyName}.pem`);
    fs.writeFileSync(keyPath, keyPair.KeyMaterial, { mode: 0o400 });
    console.log(`Private Key Saved: ${keyPath}`);

    // Re-use existing SG if possible, or create new.
    // SG ID from previous run: sg-03a6f1db96caa8a26
    const sgId = "sg-03a6f1db96caa8a26"; 
    console.log(`Using Security Group: ${sgId}`);

    console.log("Launching Instance...");
    const run = await client.send(new RunInstancesCommand({
      ImageId: "ami-0c7217cdde317cfec", // Ubuntu 22.04 LTS us-east-1
      InstanceType: "t3.medium",
      MinCount: 1,
      MaxCount: 1,
      KeyName: keyName,
      SecurityGroupIds: [sgId],
      TagSpecifications: [{
        ResourceType: "instance",
        Tags: [{ Key: "Name", Value: "sovr-valcore-prod-v2" }],
      }],
    }));

    const instanceId = run.Instances[0].InstanceId;
    console.log(`Instance Launched: ${instanceId}`);

    console.log("Waiting for instance to be running...");
    let status = "";
    while (status !== "running") {
      const desc = await client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
      status = desc.Reservations[0].Instances[0].State.Name;
      if (status !== "running") {
        await new Promise(r => setTimeout(r, 5000));
        process.stdout.write(".");
      }
    }
    console.log("\nInstance is running.");

    console.log("Finding Elastic IP Allocation...");
    const addrs = await client.send(new DescribeAddressesCommand({ PublicIps: ["3.219.195.67"] }));
    const allocId = addrs.Addresses[0].AllocationId;
    console.log(`Found Allocation ID: ${allocId}`);

    console.log("Associating Elastic IP...");
    await client.send(new AssociateAddressCommand({
      InstanceId: instanceId,
      AllocationId: allocId,
      AllowReassociation: true
    }));

    console.log(`\nSUCCESS! ValCore Production Server v2 is live at: 3.219.195.67`);
    console.log(`Instance ID: ${instanceId}`);
    console.log(`SSH Command: ssh -i ${keyPath} ubuntu@3.219.195.67`);

    console.log(`Terminating old instance ${OLD_INSTANCE_ID}...`);
    await client.send(new TerminateInstancesCommand({ InstanceIds: [OLD_INSTANCE_ID] }));
    console.log("Old instance terminated.");

  } catch (err) {
    console.error("Provisioning failed:", err);
  }
}

provision();
