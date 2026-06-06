#!/bin/bash

echo "🚀 Démarrage du système SEN-PNA..."

# Démarrer PostgreSQL
echo "📦 Démarrage PostgreSQL..."
sudo service postgresql start

# Démarrer le réseau Fabric
echo "⛓️ Démarrage du réseau Fabric..."
cd ~/fabric-samples/test-network
./network.sh up createChannel -c tracabilite -ca

# Déployer les chaincodes
echo "📝 Déploiement des chaincodes..."
./network.sh deployCC -ccn gestionLots \
  -ccp ~/senpna-tracabilite/chaincodes/gestionLots \
  -ccl go -c tracabilite

./network.sh deployCC -ccn gestionTransferts \
  -ccp ~/senpna-tracabilite/chaincodes/gestionTransferts \
  -ccl go -c tracabilite

./network.sh deployCC -ccn gestionAlertes \
  -ccp ~/senpna-tracabilite/chaincodes/gestionAlertes \
  -ccl go -c tracabilite

echo "✅ Réseau Fabric démarré !"
echo ""
echo "👉 Maintenant lancez dans 2 terminaux séparés :"
echo "   Terminal 1 : cd ~/senpna-tracabilite/api && node app.js"
echo "   Terminal 2 : cd ~/senpna-tracabilite/web && npm run dev"
