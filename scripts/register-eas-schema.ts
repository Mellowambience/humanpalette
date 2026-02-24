/**
 * ONE-TIME SETUP: Register HumanPalette EAS schema on Base.
 * Run: npx ts-node scripts/register-eas-schema.ts
 * Then set EAS_SCHEMA_UID in Supabase Edge Function secrets.
 */
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
dotenv.config();

const SCHEMA_REGISTRY = '0x4200000000000000000000000000000000000020';
const SCHEMA = 'address artistAddress, string artistId, string platform, uint64 verifiedAt, bool isVerified';

async function main() {
  const rpcUrl = process.env.EAS_RPC_URL ?? 'https://sepolia.base.org';
  const privateKey = process.env.EAS_ATTESTER_PRIVATE_KEY!;
  if (!privateKey) { console.error('EAS_ATTESTER_PRIVATE_KEY required'); process.exit(1); }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  console.log('Chain:', (await provider.getNetwork()).chainId, '|', rpcUrl);

  const registry = new SchemaRegistry(SCHEMA_REGISTRY);
  registry.connect(signer);
  const tx = await registry.register({ schema: SCHEMA, resolverAddress: ethers.ZeroAddress, revocable: true });
  const uid = await tx.wait();

  console.log('\n✅ Schema registered!');
  console.log('SCHEMA_UID:', uid);
  console.log(`Set in Supabase secrets: EAS_SCHEMA_UID=${uid}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
