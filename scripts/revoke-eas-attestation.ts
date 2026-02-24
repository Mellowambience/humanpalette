/**
 * Revoke a Human Verified attestation (fraud/AI-detected case).
 * Usage: EAS_ATTESTER_PRIVATE_KEY=0x... npx ts-node scripts/revoke-eas-attestation.ts <UID>
 */
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { EAS } from '@ethereum-attestation-service/eas-sdk';
dotenv.config();

async function main() {
  const uid = process.argv[2];
  if (!uid) { console.error('Usage: revoke-eas-attestation.ts <UID>'); process.exit(1); }
  const provider = new ethers.JsonRpcProvider(process.env.EAS_RPC_URL ?? 'https://sepolia.base.org');
  const signer = new ethers.Wallet(process.env.EAS_ATTESTER_PRIVATE_KEY!, provider);
  const eas = new EAS('0x4200000000000000000000000000000000000021');
  eas.connect(signer);
  const tx = await eas.revoke({ schema: process.env.EAS_SCHEMA_UID!, data: { uid } });
  await tx.wait();
  console.log('Revoked', uid);
  console.log('Update Supabase: artist_profiles.is_human_verified = false');
}
main().catch((e) => { console.error(e); process.exit(1); });
