#!/bin/bash
echo "🚀 Démarrage du système SEN-PNA..."

# PostgreSQL
sudo service postgresql start

# Vérifier si les conteneurs Fabric tournent déjà
CA_RUNNING=$(docker ps | grep "ca_org1" | wc -l)

if [ "$CA_RUNNING" -gt "0" ]; then
    echo "⛓️ Réseau Fabric déjà actif — pas de recréation"
else
    echo "⛓️ Démarrage du réseau Fabric..."
    cd ~/fabric-samples/test-network
    ./network.sh up createChannel -c tracabilite -ca

    echo "📝 Déploiement des chaincodes..."
    ./network.sh deployCC -ccn gestionLots \
      -ccp ~/senpna-tracabilite/chaincodes/gestionLots \
      -ccl go -c tracabilite -ccv 1.0 -ccs 1

    ./network.sh deployCC -ccn gestionTransferts \
      -ccp ~/senpna-tracabilite/chaincodes/gestionTransferts \
      -ccl go -c tracabilite -ccv 1.0 -ccs 1

    ./network.sh deployCC -ccn gestionAlertes \
      -ccp ~/senpna-tracabilite/chaincodes/gestionAlertes \
      -ccl go -c tracabilite -ccv 1.0 -ccs 1
fi

echo "✅ Réseau Fabric démarré !"
echo ""
echo "👉 Lancez maintenant :"
echo "   cd ~/senpna-tracabilite/api && node src/scripts/enrollUser.js && node app.js"
echo "   cd ~/senpna-tracabilite/web && npm run dev"
echo "   cd ~/senpna-tracabilite/mobile && REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.27 npx expo start --lan"
