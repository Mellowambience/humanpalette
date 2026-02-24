import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Modal, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { ethers } from 'ethers';
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

const EAS_CONTRACT = '0x4200000000000000000000000000000000000021';
const BASE_RPC     = 'https://mainnet.base.org';
const SCHEMA_STR   = 'address artistAddress, string artistId, string platform, uint64 verifiedAt, bool isVerified';

type AttestData = { artistAddress: string; artistId: string; platform: string; verifiedAt: number; isVerified: boolean };
type Props = { attestationUid: string; compact?: boolean };

export function HumanVerifiedBadge({ attestationUid, compact = false }: Props) {
  const [modal, setModal] = useState(false);
  const [attest, setAttest] = useState<AttestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const explorerUrl = `https://base.easscan.org/attestation/view/${attestationUid}`;

  async function load() {
    if (attest) { setModal(true); return; }
    setLoading(true); setError(null);
    try {
      const provider = new ethers.JsonRpcProvider(BASE_RPC);
      const eas = new EAS(EAS_CONTRACT);
      eas.connect(provider);
      const attestation = await eas.getAttestation(attestationUid);
      const dec = new SchemaEncoder(SCHEMA_STR).decodeData(attestation.data);
      setAttest({
        artistAddress: dec.find((d) => d.name === 'artistAddress')?.value.value as string,
        artistId:      dec.find((d) => d.name === 'artistId')?.value.value as string,
        platform:      dec.find((d) => d.name === 'platform')?.value.value as string,
        verifiedAt:    Number(dec.find((d) => d.name === 'verifiedAt')?.value.value ?? 0),
        isVerified:    Boolean(dec.find((d) => d.name === 'isVerified')?.value.value),
      });
      setModal(true);
    } catch { setError('Could not load on-chain data'); setModal(true); }
    finally { setLoading(false); }
  }

  if (compact) return (
    <TouchableOpacity onPress={load} style={s.compact}>
      {loading ? <ActivityIndicator size="small" color="#10b981" /> : <><Text style={s.check}>\u2713</Text><Text style={s.cl}>Human Verified</Text></>}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity onPress={load} style={s.full}>
        <View style={s.row}>{loading ? <ActivityIndicator size="small" color="#10b981" /> : <Text style={s.check}>\u2713</Text>}<View style={{flex:1}}><Text style={s.title}>Human Verified</Text><Text style={s.sub}>Tap to see on-chain proof</Text></View><Text style={s.chain}>Base</Text></View>
      </TouchableOpacity>
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <Pressable style={s.backdrop} onPress={() => setModal(false)} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>Human Verified Proof</Text>
          {error ? <Text style={s.err}>{error}</Text> : attest ? (
            <>
              {[['Status', attest.isVerified ? '\u2713 Verified' : '\u2717 Not Verified', attest.isVerified ? '#4ade80' : '#f87171'],
                ['Verified on', new Date(attest.verifiedAt*1000).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}), '#e2e8f0'],
                ['Platform', 'HumanPalette', '#e2e8f0'],
                ['Wallet', attest.artistAddress.slice(0,8)+'\u2026'+attest.artistAddress.slice(-6), '#e2e8f0'],
                ['Network', 'Base Mainnet', '#e2e8f0'],
              ].map(([label, val, color]) => (
                <View key={label} style={s.row2}><Text style={s.fl}>{label}</Text><Text style={[s.fv,{color}]}>{val}</Text></View>
              ))}
            </>
          ) : null}
          <TouchableOpacity style={s.ocBtn} onPress={() => Linking.openURL(explorerUrl)}><Text style={s.ocText}>View on Base EAS Scan \u2197</Text></TouchableOpacity>
          <TouchableOpacity style={s.closeBtn} onPress={() => setModal(false)}><Text style={s.closeText}>Close</Text></TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  compact: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(16,185,129,0.12)', borderRadius:8, paddingHorizontal:8, paddingVertical:3 },
  check: { color:'#10b981', fontSize:11, fontWeight:'800' },
  cl: { color:'#10b981', fontSize:11, fontWeight:'700' },
  full: { backgroundColor:'rgba(16,185,129,0.08)', borderRadius:12, borderWidth:1, borderColor:'rgba(16,185,129,0.25)', padding:14 },
  row: { flexDirection:'row', alignItems:'center', gap:10 },
  title: { color:'#10b981', fontWeight:'700', fontSize:14 },
  sub: { color:'#6b7280', fontSize:12, marginTop:1 },
  chain: { color:'#6b7280', fontSize:11, fontWeight:'600', backgroundColor:'#1e1e2e', borderRadius:5, paddingHorizontal:6, paddingVertical:2 },
  backdrop: { flex:1, backgroundColor:'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor:'#0f0f1a', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:40 },
  handle: { width:40, height:4, backgroundColor:'#333', borderRadius:2, alignSelf:'center', marginBottom:20 },
  sheetTitle: { color:'#fff', fontSize:18, fontWeight:'700', marginBottom:20 },
  row2: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10, borderBottomWidth:1, borderBottomColor:'#1e1e2e' },
  fl: { color:'#6b7280', fontSize:13 },
  fv: { fontSize:13 },
  err: { color:'#f87171', fontSize:14, textAlign:'center', marginVertical:20 },
  ocBtn: { marginTop:20, borderWidth:1, borderColor:'#7c3aed', borderRadius:12, paddingVertical:12, alignItems:'center' },
  ocText: { color:'#a78bfa', fontWeight:'600', fontSize:14 },
  closeBtn: { marginTop:10, paddingVertical:12, alignItems:'center' },
  closeText: { color:'#6b7280', fontSize:14 },
});
