import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ethers } from 'https://esm.sh/ethers@6';
import { EAS, SchemaEncoder } from 'https://esm.sh/@ethereum-attestation-service/eas-sdk@1';

const EAS_CONTRACT_ADDRESS = '0x4200000000000000000000000000000000000021';
const SCHEMA_ENCODER_STRING = 'address artistAddress, string artistId, string platform, uint64 verifiedAt, bool isVerified';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!))
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { artist_id, artist_wallet_address } = await req.json();
  if (!artist_id || !artist_wallet_address)
    return new Response(JSON.stringify({ error: 'artist_id and artist_wallet_address are required' }), { status: 400 });

  const { data: artist, error: artistErr } = await supabase
    .from('artist_profiles').select('id, is_human_verified, eas_attestation_uid').eq('id', artist_id).single();
  if (artistErr || !artist) return new Response(JSON.stringify({ error: 'Artist not found' }), { status: 404 });
  if (artist.is_human_verified && artist.eas_attestation_uid)
    return new Response(JSON.stringify({ ok: true, already_verified: true, uid: artist.eas_attestation_uid }), { status: 200 });

  const privateKey = Deno.env.get('EAS_ATTESTER_PRIVATE_KEY');
  const schemaUid  = Deno.env.get('EAS_SCHEMA_UID');
  const rpcUrl     = Deno.env.get('EAS_RPC_URL') ?? 'https://sepolia.base.org';
  if (!privateKey || !schemaUid)
    return new Response(JSON.stringify({ error: 'EAS_ATTESTER_PRIVATE_KEY and EAS_SCHEMA_UID must be set' }), { status: 503 });

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer   = new ethers.Wallet(privateKey, provider);
    const eas      = new EAS(EAS_CONTRACT_ADDRESS);
    eas.connect(signer);

    const schemaEncoder = new SchemaEncoder(SCHEMA_ENCODER_STRING);
    const encodedData   = schemaEncoder.encodeData([
      { name: 'artistAddress', value: artist_wallet_address, type: 'address' },
      { name: 'artistId',      value: artist_id,             type: 'string'  },
      { name: 'platform',      value: 'humanpalette',        type: 'string'  },
      { name: 'verifiedAt',    value: BigInt(Math.floor(Date.now() / 1000)), type: 'uint64' },
      { name: 'isVerified',    value: true,                  type: 'bool'    },
    ]);

    const tx  = await eas.attest({ schema: schemaUid, data: { recipient: artist_wallet_address, expirationTime: BigInt(0), revocable: true, data: encodedData } });
    const uid = await tx.wait();

    const { error: updateErr } = await supabase.from('artist_profiles')
      .update({ is_human_verified: true, eas_attestation_uid: uid }).eq('id', artist_id);
    if (updateErr) return new Response(JSON.stringify({ ok: false, uid, error: 'DB update failed: ' + updateErr.message }), { status: 207 });

    await supabase.from('verification_queue')
      .update({ status: 'approved', eas_attestation_uid: uid, reviewed_at: new Date().toISOString() })
      .eq('artist_id', artist_id).eq('status', 'pending');

    return new Response(JSON.stringify({
      ok: true, artist_id, uid,
      explorer_url: `https://base.easscan.org/attestation/view/${uid}`,
      network: rpcUrl.includes('sepolia') ? 'base-sepolia' : 'base-mainnet',
    }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
