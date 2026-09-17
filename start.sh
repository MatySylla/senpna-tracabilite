#!/bin/bash
echo "🚀 Démarrage du système SEN-PNA..."

# PostgreSQL
sudo service postgresql start

CONTENEURS="orderer.example.com peer0.org1.example.com peer0.org2.example.com ca_org1 ca_org2 ca_orderer"

EXISTE=$(docker ps -a --filter "name=peer0.org1.example.com" --format '{{.Names}}' | wc -l)
ACTIF=$(docker ps --filter "name=ca_org1" --format '{{.Names}}' | wc -l)

if [ "$ACTIF" -gt "0" ]; then
    echo "⛓️ Réseau Fabric déjà actif"

elif [ "$EXISTE" -gt "0" ]; then
    echo "⛓️ Conteneurs existants — redémarrage..."
    docker start $CONTENEURS
    echo "⏳ Attente de la CA (port 7054)..."
    for i in $(seq 1 30); do
        if docker exec ca_org1 true 2>/dev/null && \
           (echo > /dev/tcp/127.0.0.1/7054) 2>/dev/null; then
            echo "✅ CA prête"
            break
        fi
        sleep 2
    done

else
    echo "⛓️ Création du réseau Fabric..."
    cd ~/fabric-samples/test-network
    ./network.sh up createChannel -c tracabilite -ca

    echo "📝 Déploiement des chaincodes..."
    for CC in gestionLots gestionTransferts gestionAlertes; do
        ./network.sh deployCC -ccn $CC \
          -ccp ~/senpna-tracabilite/chaincodes/$CC \
          -ccl go -c tracabilite -ccv 1.0 -ccs 1
    done
fi

echo "✅ Réseau Fabric prêt !"
echo ""
echo "👉 Lancez maintenant :"
echo "   cd ~/senpna-tracabilite/api && node src/scripts/enrollUser.js && node app.js"
echo "   cd ~/senpna-tracabilite/web && npm run dev"
echo "   cd ~/senpna-tracabilite/mobile && REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.27 npx expo start --lan"
