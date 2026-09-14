import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Modal, TextInput } from 'react-native';
import { getAllTransferts, confirmerReception, rejeterTransfert } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TransfertsScreen() {
  const { user } = useAuth();
  const [transferts, setTransferts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [motif, setMotif] = useState('');

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    setLoading(true);
    try {
      const res = await getAllTransferts();
      const data = Array.isArray(res.data) ? res.data : [];
      const org = user?.organisation;
      const role = user?.role;
      if (['ADMIN_SENPNA', 'INSPECTEUR_ARP'].includes(role)) {
        setTransferts(data);
      } else {
        setTransferts(data.filter(t => t.destinataire === org || t.expediteur === org));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const convertDate = (ts) => {
    if (!ts) return '--';
    const m = String(ts).match(/(\d+)/);
    if (m && parseInt(m[1]) > 1000000000) return new Date(parseInt(m[1]) * 1000).toLocaleDateString('fr-FR');
    return new Date(ts).toLocaleDateString('fr-FR');
  };

  const confirmer = async (id) => {
    try { await confirmerReception(id); Alert.alert('Succes', 'Reception confirmee !'); charger(); }
    catch (e) { Alert.alert('Erreur', e.response?.data?.erreur || 'Erreur'); }
  };

  const rejeter = async () => {
    if (!motif) { Alert.alert('Erreur', 'Entrez un motif'); return; }
    try { await rejeterTransfert(selected.idTransfert, motif); Alert.alert('Succes', 'Transfert rejete'); setModal(false); setMotif(''); charger(); }
    catch (e) { Alert.alert('Erreur', e.response?.data?.erreur || 'Erreur'); }
  };

  const peutGerer = ['PHARMACIEN_PRA', 'AGENT_DISTRICT', 'AGENT_STRUCTURE'].includes(user?.role);

  const getStatutStyle = (st) => {
    if (st === 'Confirme') return { bg: '#E8F5E9', color: '#1B5E20' };
    if (st === 'En attente') return { bg: '#FFF8E1', color: '#E65100' };
    return { bg: '#FCEBEB', color: '#A32D2D' };
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f8' }}>
      <FlatList
        data={transferts}
        keyExtractor={item => item.idTransfert}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={charger} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={s.empty}>Aucun transfert</Text>}
        renderItem={({ item }) => {
          const st = getStatutStyle(item.statut);
          return (
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.id}>{item.idTransfert}</Text>
                <View style={[s.badge, { backgroundColor: st.bg }]}>
                  <Text style={[s.badgeText, { color: st.color }]}>{item.statut}</Text>
                </View>
              </View>
              <Text style={s.info}>Lot : <Text style={s.bold}>{item.idLot}</Text></Text>
              <Text style={s.info}>{item.expediteur} → {item.destinataire}</Text>
              <Text style={s.info}>Quantite : {item.quantite} — Date : {convertDate(item.horodatage)}</Text>
              {peutGerer && item.statut === 'En attente' && item.destinataire === user?.organisation && (
                <View style={s.btnRow}>
                  <TouchableOpacity style={s.confirmerBtn} onPress={() => confirmer(item.idTransfert)}>
                    <Text style={s.confirmerText}>✅ Confirmer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.rejeterBtn} onPress={() => { setSelected(item); setModal(true); }}>
                    <Text style={s.rejeterText}>❌ Rejeter</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Motif de rejet</Text>
            <TextInput style={s.modalInput} placeholder="Decrivez le motif..." value={motif} onChangeText={setMotif} multiline />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}>
                <Text style={{ color: '#555', fontWeight: '600' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={rejeter}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  id: { fontSize: 16, fontWeight: '700', color: '#185FA5' },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  info: { fontSize: 13, color: '#444', marginBottom: 3 },
  bold: { fontWeight: '600', color: '#1a1a1a' },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  confirmerBtn: { flex: 1, backgroundColor: '#E8F5E9', borderRadius: 8, padding: 10, alignItems: 'center' },
  confirmerText: { color: '#1B5E20', fontWeight: '600' },
  rejeterBtn: { flex: 1, backgroundColor: '#FCEBEB', borderRadius: 8, padding: 10, alignItems: 'center' },
  rejeterText: { color: '#A32D2D', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalInput: { backgroundColor: '#f5f7fa', borderRadius: 10, padding: 14, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#e0e6ed', marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#f5f7fa', borderRadius: 10, padding: 14, alignItems: 'center' },
  confirmBtn: { flex: 1, backgroundColor: '#A32D2D', borderRadius: 10, padding: 14, alignItems: 'center' },
});
