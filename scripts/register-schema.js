// One-time script: registers the HumanPalette EAS schema on Base mainnet
// Run from the repo root: node scripts/register-schema.js
//
// Prerequisites:
//   1. Wallet 0xd34a71bd2c5cD7B16c63c8461114A32f76C6D4Ea must have ETH on Base mainnet
//      Bridge from Ethereum or buy directly on Base via Coinbase/Metamask.
//      ~0.001 ETH (~$3) is more than enough.
//   2. From the repo root: npm install (installs eas-sdk + ethers)

const { SchemaRegistry } = require('@ethereum-attestation-service/eas-sdk');
const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  const signer = new ethers.Wallet(
    '0x18da82925c46ea8df6a573a08255672427ec1abbfeda86ff0dbeefd184dc27e2',
    provider
  );

  // Base mainnet SchemaRegistry is at ...0020 (EAS contract is ...0021)
  const registry = new SchemaRegistry('0x4200000000000000000000000000000000000020');
  registry.connect(signer);

  const balance = await provider.getBalance(signer.address);
  console.log('Wallet:', signer.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH');

  if (balance === 0n) {
    console.error('ERROR: Wallet has 0 ETH. Fund it on Base mainnet first, then re-run.');
    process.exit(1);
  }

  console.log('Registering schema on Base mainnet...');

  const tx = await registry.register({
    schema: 'address artistId, bool humanVerified, uint64 verifiedAt, string proofHash',
    resolverAddress: ethers.ZeroAddress,
    revocable: true,
  });

  console.log('Waiting for confirmation...');
  const receipt = await tx.wait();
  console.log('\n✅ Schema UID:', receipt);
  console.log('\nSave this UID — paste it back to SureThing to wire into eas-attest config.');
}

main().catch(console.error);
