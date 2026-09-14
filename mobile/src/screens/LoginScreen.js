import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();

  const handleLogin = async () => {
    if (!email || !motDePasse) { Alert.alert('Erreur', 'Remplissez tous les champs'); return; }
    setLoading(true);
    try {
      const res = await login(email, motDePasse);
      await loginUser(res.data.token, res.data.utilisateur);
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.erreur || 'Verifiez votre connexion');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.card}>
        <Text style={s.logo}>💊</Text>
        <Text style={s.title}>SEN-PNA</Text>
        <Text style={s.sub}>Tracabilite pharmaceutique blockchain</Text>
        <TextInput style={s.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#999" />
        <TextInput style={s.input} placeholder="Mot de passe" value={motDePasse} onChangeText={setMotDePasse} secureTextEntry placeholderTextColor="#999" />
        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Se connecter</Text>}
        </TouchableOpacity>
        <Text style={s.footer}>Hyperledger Fabric v2.5</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '88%', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12 },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#185FA5', marginBottom: 4 },
  sub: { fontSize: 13, color: '#666', marginBottom: 24, textAlign: 'center' },
  input: { width: '100%', backgroundColor: '#f5f7fa', borderRadius: 10, padding: 14, fontSize: 15, color: '#333', marginBottom: 12, borderWidth: 1, borderColor: '#e0e6ed' },
  btn: { width: '100%', backgroundColor: '#185FA5', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { marginTop: 24, fontSize: 11, color: '#aaa' },
});
