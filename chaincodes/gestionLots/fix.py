import re

with open('gestionLots.go', 'r') as f:
    content = f.read()

# Remplacer l'import time inutilisé et ajouter fmt
content = content.replace(
    '"time"\n\t"github.com/hyperledger/fabric-contract-api-go/contractapi"',
    '"github.com/hyperledger/fabric-contract-api-go/contractapi"'
)

# Remplacer GetTxTimestamp() par une conversion string
content = content.replace(
    'DateCreation:       ctx.GetStub().GetTxTimestamp(),',
    'DateCreation:       func() string { ts, _ := ctx.GetStub().GetTxTimestamp(); return fmt.Sprintf("%d", ts.Seconds) }(),'
)
content = content.replace(
    'DateMiseAJour:      ctx.GetStub().GetTxTimestamp(),',
    'DateMiseAJour:      func() string { ts, _ := ctx.GetStub().GetTxTimestamp(); return fmt.Sprintf("%d", ts.Seconds) }(),'
)
content = content.replace(
    'lot.DateMiseAJour = ctx.GetStub().GetTxTimestamp()',
    'ts, _ := ctx.GetStub().GetTxTimestamp()\n\tlot.DateMiseAJour = fmt.Sprintf("%d", ts.Seconds)'
)

with open('gestionLots.go', 'w') as f:
    f.write(content)

print("Corrigé !")
