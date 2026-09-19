import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getAllLots, getAllTransferts, getAllAlertes } from '../services/api';

export default function DashboardScreen() {
  const { user, logoutUser } = useAuth();
  const [stats, setStats] = useState({ lots: 0, transferts: 0, alertes: 0, attente: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    setLoading(true);
    try {
      const [l, t, a] = await Promise.all([getAllLots(), getAllTransferts(), getAllAlertes()]);
      setStats({
        lots: Array.isArray(l.data) ? l.data.length : 0,
        transferts: Array.isArray(t.data) ? t.data.length : 0,
        alertes: Array.isArray(a.data) ? a.data.filter(x => x.estActive).length : 0,
        attente: Array.isArray(t.data) ? t.data.filter(x => x.statut === 'En attente').length : 0,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const metriques = [
    { icon: '📦', label: 'Lots', valeur: stats.lots, bg: '#E6F1FB' },
    { icon: '🔄', label: 'Transferts', valeur: stats.transferts, bg: '#EAF3DE' },
    { icon: '🔔', label: 'Alertes', valeur: stats.alertes, bg: '#FCEBEB' },
    { icon: '⏰', label: 'En attente', valeur: stats.attente, bg: '#FAEEDA' },
  ];

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={charger} />}>
      <View style={s.header}>
        <View>
          <Text style={s.welcome}>Bonjour, {user?.prenom} {user?.nom}</Text>
          <Text style={s.org}>{user?.nomOrganisation}</Text>
          <View style={s.badge}><Text style={s.badgeText}>{user?.role}</Text></View>
        </View>
        <TouchableOpacity style={s.logout} onPress={logoutUser}>
          <Text style={s.logoutText}>Deconnexion</Text>
        </TouchableOpacity>
      </View>
      <View style={s.grid}>
        {metriques.map(m => (
          <View key={m.label} style={[s.card, { backgroundColor: m.bg }]}>
            <Text style={s.cardIcon}>{m.icon}</Text>
            <Text style={s.cardVal}>{loading ? '...' : m.valeur}</Text>
            <Text style={s.cardLabel}>{m.label}</Text>
          </View>
        ))}
      </View>
      <View style={s.networkCard}>
        <Text style={s.networkTitle}>🔗 Reseau blockchain</Text>
        {['Hyperledger Fabric v2.5 — Actif', 'Channel : tracabilite', '3 chaincodes deployes'].map(t => (
          <View key={t} style={s.networkRow}>
            <View style={s.dot} />
            <Text style={s.networkText}>{t}</Text>
          </View>
        ))}
        <TouchableOpacity style={s.refreshBtn} onPress={charger}>
          <Text style={s.refreshText}>🔄 Actualiser</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { backgroundColor: '#185FA5', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  welcome: { color: '#fff', fontSize: 18, fontWeight: '700' },
  org: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6, alignSelf: 'flex-start' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  logout: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { color: '#fff', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  card: { width: '47%', borderRadius: 12, padding: 16, alignItems: 'center' },
  cardIcon: { fontSize: 28, marginBottom: 6 },
  cardVal: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  cardLabel: { fontSize: 12, color: '#555', marginTop: 2 },
  networkCard: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, elevation: 2 },
  networkTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 10 },
  networkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B6D11', marginRight: 8 },
  networkText: { fontSize: 13, color: '#444' },
  refreshBtn: { backgroundColor: '#f0f4f8', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 10 },
  refreshText: { color: '#185FA5', fontSize: 13, fontWeight: '500' },
});
