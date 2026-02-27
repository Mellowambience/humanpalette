// One-time script: registers the HumanPalette EAS schema on Base mainnet
// Run from the repo root: node scripts/register-schema.js

const { SchemaRegistry } = require('@ethereum-attestation-service/eas-sdk');
const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  const signer = new ethers.Wallet(
    '0x18da82925c46ea8df6a573a08255672427ec1abbfeda86ff0dbeefd184dc27e2',
    provider
  );

  const registry = new SchemaRegistry('0x4200000000000000000000000000000000000021');
  registry.connect(signer);

  console.log('Registering schema on Base mainnet...');

  const tx = await registry.register({
    schema: 'address artistId, bool humanVerified, uint64 verifiedAt, string proofHash',
    resolverAddress: ethers.ZeroAddress,
    revocable: true,
  });

  console.log('Waiting for confirmation...');
  const receipt = await tx.wait();
  console.log('Schema UID:', receipt);
}

main().catch(console.error);
