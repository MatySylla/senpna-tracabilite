package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract structure
type SmartContract struct {
	contractapi.Contract
}

// LotMedicament — Asset principal
type LotMedicament struct {
	IdLot              string  `json:"idLot"`
	NomMedicament      string  `json:"nomMedicament"`
	CodeGTIN           string  `json:"codeGTIN"`
	Fabricant          string  `json:"fabricant"`
	DateFabrication    string  `json:"dateFabrication"`
	DateExpiration     string  `json:"dateExpiration"`
	Quantite           int     `json:"quantite"`
	ProprietaireActuel string  `json:"proprietaireActuel"`
	Statut             string  `json:"statut"`
	Temperature        float64 `json:"temperature"`
	DateCreation       string  `json:"dateCreation"`
	DateMiseAJour      string  `json:"dateMiseAJour"`
}

// CreateLot — Créer un nouveau lot
func (s *SmartContract) CreateLot(
	ctx contractapi.TransactionContextInterface,
	idLot string,
	nomMedicament string,
	codeGTIN string,
	fabricant string,
	dateFabrication string,
	dateExpiration string,
	quantite int,
	temperature float64) error {

	// Vérifier que le lot n'existe pas déjà
	lotExistant, err := ctx.GetStub().GetState(idLot)
	if err != nil {
		return fmt.Errorf("erreur lecture ledger : %v", err)
	}
	if lotExistant != nil {
		return fmt.Errorf("le lot %s existe déjà", idLot)
	}

	// Créer le lot
	lot := LotMedicament{
		IdLot:              idLot,
		NomMedicament:      nomMedicament,
		CodeGTIN:           codeGTIN,
		Fabricant:          fabricant,
		DateFabrication:    dateFabrication,
		DateExpiration:     dateExpiration,
		Quantite:           quantite,
		ProprietaireActuel: "SEN-PNA",
		Statut:             "En stock SEN-PNA",
		Temperature:        temperature,
		DateCreation:       time.Now().Format(time.RFC3339),
		DateMiseAJour:      time.Now().Format(time.RFC3339),
	}

	// Sérialiser et sauvegarder
	lotJSON, err := json.Marshal(lot)
	if err != nil {
		return fmt.Errorf("erreur sérialisation : %v", err)
	}

	return ctx.GetStub().PutState(idLot, lotJSON)
}

// GetLot — Consulter un lot
func (s *SmartContract) GetLot(
	ctx contractapi.TransactionContextInterface,
	idLot string) (*LotMedicament, error) {

	lotJSON, err := ctx.GetStub().GetState(idLot)
	if err != nil {
		return nil, fmt.Errorf("erreur lecture : %v", err)
	}
	if lotJSON == nil {
		return nil, fmt.Errorf("lot %s introuvable", idLot)
	}

	var lot LotMedicament
	err = json.Unmarshal(lotJSON, &lot)
	if err != nil {
		return nil, err
	}
	return &lot, nil
}

// UpdateStatut — Mettre à jour le statut
func (s *SmartContract) UpdateStatut(
	ctx contractapi.TransactionContextInterface,
	idLot string,
	nouveauStatut string) error {

	lot, err := s.GetLot(ctx, idLot)
	if err != nil {
		return err
	}

	lot.Statut = nouveauStatut
	lot.DateMiseAJour = time.Now().Format(time.RFC3339)

	lotJSON, err := json.Marshal(lot)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(idLot, lotJSON)
}

// GetHistorique — Historique complet d'un lot
func (s *SmartContract) GetHistorique(
	ctx contractapi.TransactionContextInterface,
	idLot string) (string, error) {

	resultsIterator, err := ctx.GetStub().GetHistoryForKey(idLot)
	if err != nil {
		return "", err
	}
	defer resultsIterator.Close()

	var historique []map[string]interface{}
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return "", err
		}
		transaction := map[string]interface{}{
			"txId":      response.TxId,
			"timestamp": response.Timestamp.String(),
			"valeur":    string(response.Value),
			"supprime":  response.IsDelete,
		}
		historique = append(historique, transaction)
	}

	historiqueJSON, err := json.Marshal(historique)
	if err != nil {
		return "", err
	}

	return string(historiqueJSON), nil
}

// GetAllLots — Lister tous les lots
func (s *SmartContract) GetAllLots(
	ctx contractapi.TransactionContextInterface) ([]*LotMedicament, error) {

	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var lots []*LotMedicament
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var lot LotMedicament
		err = json.Unmarshal(queryResponse.Value, &lot)
		if err != nil {
			return nil, err
		}
		lots = append(lots, &lot)
	}
	return lots, nil
}

// VerifierAuthenticite — Vérification publique par QR code
func (s *SmartContract) VerifierAuthenticite(
	ctx contractapi.TransactionContextInterface,
	idLot string) (string, error) {

	lotJSON, err := ctx.GetStub().GetState(idLot)
	if err != nil {
		return "", err
	}

	if lotJSON == nil {
		result := map[string]string{
			"statut":  "SUSPECT",
			"message": "Médicament non enregistré dans le système SEN-PNA",
		}
		resultJSON, _ := json.Marshal(result)
		return string(resultJSON), nil
	}

	var lot LotMedicament
	json.Unmarshal(lotJSON, &lot)

	if lot.Statut == "Rappelé" {
		result := map[string]string{
			"statut":  "RAPPELÉ",
			"message": "Ce lot a fait l'objet d'un rappel officiel — Ne pas consommer",
		}
		resultJSON, _ := json.Marshal(result)
		return string(resultJSON), nil
	}

	result := map[string]interface{}{
		"statut":      "AUTHENTIQUE",
		"nomMed":      lot.NomMedicament,
		"fabricant":   lot.Fabricant,
		"expiration":  lot.DateExpiration,
		"proprietaire": lot.ProprietaireActuel,
	}
	resultJSON, _ := json.Marshal(result)
	return string(resultJSON), nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		fmt.Printf("Erreur création chaincode : %v", err)
		return
	}
	if err := chaincode.Start(); err != nil {
		fmt.Printf("Erreur démarrage chaincode : %v", err)
	}
}