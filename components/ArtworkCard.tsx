// components/ArtworkCard.tsx
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.62;

interface Artwork {
  id: string; title: string; description: string | null; media_urls: string[];
  price: number; allows_commercial: boolean;
  artist: { display_name: string; avatar_url: string | null; artist_profiles: { human_verified_badge: boolean; verification_status: string } | null };
}

export default function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const isVerified = artwork.artist.artist_profiles?.human_verified_badge ?? false;
  const primaryImage = artwork.media_urls[0];
  return (
    <View style={styles.card}>
      {primaryImage ? (
        <Image source={{ uri: primaryImage }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}><Text style={styles.placeholderText}>No image</Text></View>
      )}
      <View style={styles.gradient} />
      <View style={styles.content}>
        <View style={styles.artistRow}>
          {artwork.artist.avatar_url && <Image source={{ uri: artwork.artist.avatar_url }} style={styles.avatar} />}
          <View style={styles.artistInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.artistName}>{artwork.artist.display_name}</Text>
              {isVerified && <View style={styles.badge}><Text style={styles.badgeText}>✓ Human</Text></View>}
            </View>
            <Text style={styles.artTitle}>{artwork.title}</Text>
          </View>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>\${artwork.price.toLocaleString()}</Text>
          {artwork.allows_commercial && <View style={styles.commercialTag}><Text style={styles.commercialText}>Commercial OK</Text></View>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: width - 32, height: CARD_HEIGHT, borderRadius: 20, overflow: 'hidden', backgroundColor: '#141414', alignSelf: 'center' },
  image: { width: '100%', height: '100%', position: 'absolute' },
  placeholder: { backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#444', fontSize: 14 },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(0,0,0,0.6)' },
  content: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, gap: 10 },
  artistRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  artistInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  artistName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  badge: { backgroundColor: 'rgba(76,175,80,0.2)', borderWidth: 1, borderColor: 'rgba(76,175,80,0.4)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#4caf50', fontSize: 10, fontWeight: '600' },
  artTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { color: '#fff', fontSize: 22, fontWeight: '700' },
  commercialTag: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  commercialText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
});
