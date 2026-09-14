with open('gestionTransferts.go', 'r') as f:
    content = f.read()

# Remplacer les time.Now()
content = content.replace(
    'Horodatage:       time.Now().Format(time.RFC3339),',
    'Horodatage:       func() string { ts, _ := ctx.GetStub().GetTxTimestamp(); return fmt.Sprintf("%d", ts.Seconds) }(),'
)
content = content.replace(
    'transfert.DateConfirmation = time.Now().Format(time.RFC3339)',
    'ts, _ := ctx.GetStub().GetTxTimestamp()\n\ttransfert.DateConfirmation = fmt.Sprintf("%d", ts.Seconds)'
)

# Supprimer import time
content = content.replace('\t"time"\n', '')

with open('gestionTransferts.go', 'w') as f:
    f.write(content)

print("gestionTransferts.go corrigé !")
