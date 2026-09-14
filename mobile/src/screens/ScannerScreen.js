import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { verifierAuthenticite } from '../services/api';

export default function ScannerScreen() {
  const [idLot, setIdLot] = useState('');
  const [resultat, setResultat] = useState(null);
  const [loading, setLoading] = useState(false);

  const verifier = async (id) => {
    const lotId = id || idLot;
    if (!lotId) { Alert.alert('Erreur', 'Entrez un ID de lot'); return; }
    setLoading(true);
    setResultat(null);
    try {
      const res = await verifierAuthenticite(lotId);
      setResultat(res.data);
    } catch (e) {
      setResultat({ statut: 'SUSPECT', message: 'Lot non trouve dans la blockchain' });
    } finally { setLoading(false); }
  };

  const getStyle = (statut) => {
    if (statut === 'AUTHENTIQUE') return { bg: '#E8F5E9', color: '#1B5E20', icon: '✅' };
    if (statut === 'RAPPELE') return { bg: '#FFF8E1', color: '#E65100', icon: '⚠️' };
    return { bg: '#FCEBEB', color: '#A32D2D', icon: '🚫' };
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.card}>
        <Text style={s.logo}>💊</Text>
        <Text style={s.title}>Verification medicament</Text>
        <Text style={s.sub}>Saisissez l identifiant du lot</Text>
        <View style={s.row}>
          <TextInput style={s.input} placeholder="Ex: ML-045" value={idLot} onChangeText={setIdLot} autoCapitalize="characters" placeholderTextColor="#999" />
          <TouchableOpacity style={s.searchBtn} onPress={() => verifier()} disabled={loading}>
            <Text style={s.searchBtnText}>{loading ? '...' : '🔍'}</Text>
          </TouchableOpacity>
        </View>
        {resultat && (() => {
          const st = getStyle(resultat.statut);
          return (
            <View style={[s.resultat, { backgroundColor: st.bg }]}>
              <Text style={s.resultatIcon}>{st.icon}</Text>
              <Text style={[s.resultatStatut, { color: st.color }]}>{resultat.statut}</Text>
              {resultat.nomMedicament && <Text style={s.info}>Medicament : {resultat.nomMedicament}</Text>}
              {resultat.fabricant && <Text style={s.info}>Fabricant : {resultat.fabricant}</Text>}
              {resultat.dateExpiration && <Text style={s.info}>Expiration : {resultat.dateExpiration}</Text>}
              {resultat.proprietaireActuel && <Text style={s.info}>Proprietaire : {resultat.proprietaireActuel}</Text>}
              {resultat.message && <Text style={[s.info, { color: st.color }]}>{resultat.message}</Text>}
            </View>
          );
        })()}
        <Text style={s.testsTitle}>Tests rapides :</Text>
        <View style={s.testsRow}>
          {['ML-045', 'ML-046', 'ML-047', 'FAUX-001'].map(id => (
            <TouchableOpacity key={id} style={s.testBtn} onPress={() => { setIdLot(id); verifier(id); }}>
              <Text style={s.testBtnText}>{id}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.footer}>Systeme SEN-PNA — Blockchain Hyperledger Fabric v2.5</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 24, alignItems: 'center', elevation: 2 },
  logo: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#185FA5', marginBottom: 4 },
  sub: { fontSize: 13, color: '#666', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 16 },
  input: { flex: 1, backgroundColor: '#f5f7fa', borderRadius: 10, padding: 14, fontSize: 15, color: '#333', borderWidth: 1, borderColor: '#e0e6ed' },
  searchBtn: { backgroundColor: '#185FA5', borderRadius: 10, width: 52, justifyContent: 'center', alignItems: 'center' },
  searchBtnText: { fontSize: 20 },
  resultat: { width: '100%', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  resultatIcon: { fontSize: 40, marginBottom: 8 },
  resultatStatut: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  info: { fontSize: 14, color: '#333', marginBottom: 3 },
  testsTitle: { fontSize: 13, color: '#666', marginBottom: 8, alignSelf: 'flex-start' },
  testsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', marginBottom: 16 },
  testBtn: { backgroundColor: '#f0f4f8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  testBtnText: { fontSize: 12, color: '#185FA5', fontWeight: '500' },
  footer: { fontSize: 11, color: '#aaa', textAlign: 'center' },
});
