import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { getAllAlertes } from '../services/api';

export default function AlertesScreen() {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    setLoading(true);
    try {
      const res = await getAllAlertes();
      setAlertes(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const convertDate = (ts) => {
    if (!ts) return '--';
    const m = String(ts).match(/(\d+)/);
    if (m && parseInt(m[1]) > 1000000000) return new Date(parseInt(m[1]) * 1000).toLocaleDateString('fr-FR');
    return new Date(ts).toLocaleDateString('fr-FR');
  };

  const getStyle = (g) => {
    if (g === 'Critique') return { bg: '#FCEBEB', color: '#A32D2D', icon: '🚨' };
    if (g === 'Eleve') return { bg: '#FFF8E1', color: '#E65100', icon: '⚠️' };
    return { bg: '#E6F1FB', color: '#185FA5', icon: 'ℹ️' };
  };

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: '#f0f4f8' }}
      data={alertes}
      keyExtractor={item => item.idAlerte}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={charger} />}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={<Text style={s.empty}>Aucune alerte</Text>}
      renderItem={({ item }) => {
        const st = getStyle(item.niveauGravite);
        return (
          <View style={[s.card, { borderLeftWidth: 4, borderLeftColor: st.color }]}>
            <View style={s.row}>
              <Text style={s.icon}>{st.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.id}>{item.idAlerte} — {item.typeAlerte}</Text>
                <Text style={s.sub}>Lot : {item.idLot} | {convertDate(item.horodatage)}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: st.bg }]}>
                <Text style={[s.badgeText, { color: st.color }]}>{item.niveauGravite}</Text>
              </View>
            </View>
            <Text style={s.message}>{item.message}</Text>
            <Text style={[s.active, { color: item.estActive ? '#1B5E20' : '#999' }]}>
              {item.estActive ? '● Active' : '○ Resolue'}
            </Text>
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  icon: { fontSize: 24 },
  id: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  message: { fontSize: 13, color: '#555', fontStyle: 'italic', marginBottom: 6 },
  active: { fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});
