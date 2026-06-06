import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { verifierAuthenticite } from '../../services/api';

const Verification = () => {
  const [idLot, setIdLot] = useState('');
  const [resultat, setResultat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [modeScanner, setModeScanner] = useState(false);
  const scannerRef = useRef(null);

  // Démarrer le scanner QR code
  useEffect(() => {
    if (modeScanner) {
      // Initialiser le scanner
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      // Quand un QR code est détecté
      scanner.render(
        (decodedText) => {
          // Extraire l'ID du lot depuis le QR code
          setIdLot(decodedText);
          setModeScanner(false);
          scanner.clear();
          // Vérifier automatiquement
          handleVerifier(decodedText);
        },
        // eslint-disable-next-line no-unused-vars
        (errorMessage) => {
          // Ignorer les erreurs de scan en cours
          console.log('Scan en cours...');
        }
      );

      scannerRef.current = scanner;

      // Nettoyer le scanner quand on quitte
      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
      };
    }
  }, [modeScanner]);

  // Vérifier l'authenticité du médicament
  const handleVerifier = async (id = idLot) => {
    if (!id) return;
    setLoading(true);
    setErreur('');
    setResultat(null);
    try {
      const res = await verifierAuthenticite(id);
      setResultat(res.data);
    } catch (err) {
      setErreur('Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  // Style selon le statut du médicament
  const getStyle = (statut) => {
    if (statut === 'AUTHENTIQUE') return {
      bg: '#EAF3DE', border: '#C0DD97',
      color: '#27500A', icon: '✅', titre: 'Médicament authentique'
    };
    if (statut === 'RAPPELÉ') return {
      bg: '#FAEEDA', border: '#FAC775',
      color: '#633806', icon: '⚠️', titre: 'Lot rappelé — Ne pas consommer'
    };
    return {
      bg: '#FCEBEB', border: '#F7C1C1',
      color: '#791F1F', icon: '⛔', titre: 'Médicament suspect'
    };
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E6F1FB 0%, #f5f7fa 100%)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 40,
        width: '100%', maxWidth: 480,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>

        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>💊</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#185FA5', marginBottom: 6 }}>
            Vérification médicament
          </h1>
          <p style={{ fontSize: 14, color: '#666' }}>
            Scannez le QR code ou saisissez l&apos;identifiant du lot
          </p>
        </div>

        {/* Boutons de mode */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setModeScanner(false)}
            style={{
              flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
              border: !modeScanner ? '2px solid #185FA5' : '1px solid #ddd',
              background: !modeScanner ? '#E6F1FB' : 'white',
              color: !modeScanner ? '#185FA5' : '#555',
              fontWeight: !modeScanner ? 600 : 400, fontSize: 13
            }}>
            ⌨️ Saisie manuelle
          </button>
          <button
            onClick={() => { setModeScanner(true); setResultat(null); }}
            style={{
              flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
              border: modeScanner ? '2px solid #185FA5' : '1px solid #ddd',
              background: modeScanner ? '#E6F1FB' : 'white',
              color: modeScanner ? '#185FA5' : '#555',
              fontWeight: modeScanner ? 600 : 400, fontSize: 13
            }}>
            📷 Scanner QR code
          </button>
        </div>

        {/* Mode saisie manuelle */}
        {!modeScanner && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input
              value={idLot}
              onChange={e => setIdLot(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleVerifier()}
              placeholder="Ex: ML-042, ART-001..."
              style={{
                flex: 1, padding: '12px 16px',
                border: '1px solid #ddd', borderRadius: 10,
                fontSize: 15, outline: 'none'
              }}
            />
            <button
              onClick={() => handleVerifier()}
              disabled={loading}
              style={{
                padding: '12px 20px', background: '#185FA5',
                color: 'white', border: 'none', borderRadius: 10,
                cursor: 'pointer', fontSize: 15, fontWeight: 500
              }}>
              {loading ? '...' : '🔍'}
            </button>
          </div>
        )}

        {/* Mode scanner QR code */}
        {modeScanner && (
          <div style={{ marginBottom: 16 }}>
            <div id="qr-reader" style={{ width: '100%' }}></div>
            <button
              onClick={() => setModeScanner(false)}
              style={{
                width: '100%', marginTop: 10, padding: '10px',
                background: '#FCEBEB', color: '#A32D2D',
                border: '1px solid #F7C1C1', borderRadius: 8,
                cursor: 'pointer', fontSize: 13
              }}>
              ❌ Annuler le scan
            </button>
          </div>
        )}

        {/* Message d'erreur */}
        {erreur && (
          <div style={{
            background: '#FCEBEB', color: '#A32D2D',
            padding: '10px 14px', borderRadius: 8,
            fontSize: 13, marginBottom: 16
          }}>
            {erreur}
          </div>
        )}

        {/* Résultat de la vérification */}
        {resultat && (() => {
          const style = getStyle(resultat.statut);
          return (
            <div style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              borderRadius: 12, padding: 20
            }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 10, marginBottom: 16
              }}>
                <span style={{ fontSize: 28 }}>{style.icon}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: style.color }}>
                    {resultat.statut}
                  </div>
                  <div style={{ fontSize: 13, color: style.color, opacity: 0.8 }}>
                    {style.titre}
                  </div>
                </div>
              </div>

              {/* Détails si authentique */}
              {resultat.statut === 'AUTHENTIQUE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    ['Médicament', resultat.nomMed],
                    ['Fabricant', resultat.fabricant],
                    ['Date expiration', resultat.expiration],
                    ['Propriétaire actuel', resultat.proprietaire],
                  ].map(([k, v]) => (
                    <div key={k} style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 13, padding: '6px 0',
                      borderBottom: `1px solid ${style.border}`
                    }}>
                      <span style={{ color: style.color, opacity: 0.8 }}>{k}</span>
                      <span style={{ fontWeight: 600, color: style.color }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Message si suspect ou rappelé */}
              {resultat.message && (
                <p style={{
                  fontSize: 14, color: style.color,
                  fontWeight: 500, margin: 0
                }}>
                  {resultat.message}
                </p>
              )}
            </div>
          );
        })()}

        {/* Boutons de test rapide */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #eee' }}>
          <p style={{ fontSize: 12, color: '#999', marginBottom: 10, textAlign: 'center' }}>
            Tests rapides :
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {[
              { id: 'ML-043', label: '✅ Authentique' },
              { id: 'ML-042', label: '⚠️ Rappelé' },
              { id: 'FAUX-001', label: '⛔ Suspect' },
            ].map(t => (
              <button key={t.id}
                onClick={() => { setIdLot(t.id); handleVerifier(t.id); }}
                style={{
                  padding: '6px 12px', background: '#f0f4f8',
                  border: '1px solid #ddd', borderRadius: 6,
                  cursor: 'pointer', fontSize: 11, color: '#555'
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 20 }}>
          Système SEN-PNA — Blockchain Hyperledger Fabric v2.5
        </p>
      </div>
    </div>
  );
};

export default Verification;