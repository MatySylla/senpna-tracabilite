package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

type Alerte struct {
	IdAlerte      string `json:"idAlerte"`
	IdLot         string `json:"idLot"`
	TypeAlerte    string `json:"typeAlerte"`
	NiveauGravite string `json:"niveauGravite"`
	Message       string `json:"message"`
	Emetteur      string `json:"emetteur"`
	Horodatage    string `json:"horodatage"`
	EstActive     bool   `json:"estActive"`
}

// CreerAlerte — Créer une nouvelle alerte
func (s *SmartContract) CreerAlerte(
	ctx contractapi.TransactionContextInterface,
	idAlerte string,
	idLot string,
	typeAlerte string,
	niveauGravite string,
	message string,
	emetteur string) error {

	// Vérifier que l'alerte n'existe pas déjà
	alerteExistante, err := ctx.GetStub().GetState(idAlerte)
	if err != nil {
		return fmt.Errorf("erreur lecture ledger : %v", err)
	}
	if alerteExistante != nil {
		return fmt.Errorf("alerte %s existe déjà", idAlerte)
	}

	alerte := Alerte{
		IdAlerte:      idAlerte,
		IdLot:         idLot,
		TypeAlerte:    typeAlerte,
		NiveauGravite: niveauGravite,
		Message:       message,
		Emetteur:      emetteur,
		Horodatage:    time.Now().Format(time.RFC3339),
		EstActive:     true,
	}

	alerteJSON, err := json.Marshal(alerte)
	if err != nil {
		return fmt.Errorf("erreur sérialisation : %v", err)
	}

	return ctx.GetStub().PutState(idAlerte, alerteJSON)
}

// GetAlerte — Consulter une alerte
func (s *SmartContract) GetAlerte(
	ctx contractapi.TransactionContextInterface,
	idAlerte string) (*Alerte, error) {

	alerteJSON, err := ctx.GetStub().GetState(idAlerte)
	if err != nil {
		return nil, fmt.Errorf("erreur lecture : %v", err)
	}
	if alerteJSON == nil {
		return nil, fmt.Errorf("alerte %s introuvable", idAlerte)
	}

	var alerte Alerte
	err = json.Unmarshal(alerteJSON, &alerte)
	if err != nil {
		return nil, err
	}
	return &alerte, nil
}

// DeclencherRappel — ARP déclenche un rappel officiel
func (s *SmartContract) DeclencherRappel(
	ctx contractapi.TransactionContextInterface,
	idAlerte string,
	idLot string,
	motif string) error {

	// Vérifier que l'alerte n'existe pas déjà
	alerteExistante, err := ctx.GetStub().GetState(idAlerte)
	if err != nil {
		return fmt.Errorf("erreur lecture : %v", err)
	}
	if alerteExistante != nil {
		return fmt.Errorf("rappel %s existe déjà", idAlerte)
	}

	alerte := Alerte{
		IdAlerte:      idAlerte,
		IdLot:         idLot,
		TypeAlerte:    "Rappel officiel",
		NiveauGravite: "Critique",
		Message:       "RAPPEL OFFICIEL ARP — " + motif,
		Emetteur:      "ARP",
		Horodatage:    time.Now().Format(time.RFC3339),
		EstActive:     true,
	}

	alerteJSON, err := json.Marshal(alerte)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(idAlerte, alerteJSON)
}

// ResolveAlerte — Marquer une alerte comme résolue
func (s *SmartContract) ResolveAlerte(
	ctx contractapi.TransactionContextInterface,
	idAlerte string) error {

	alerte, err := s.GetAlerte(ctx, idAlerte)
	if err != nil {
		return err
	}

	alerte.EstActive = false

	alerteJSON, err := json.Marshal(alerte)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(idAlerte, alerteJSON)
}

// GetAllAlertes — Lister toutes les alertes
func (s *SmartContract) GetAllAlertes(
	ctx contractapi.TransactionContextInterface) ([]*Alerte, error) {

	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var alertes []*Alerte
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var alerte Alerte
		err = json.Unmarshal(queryResponse.Value, &alerte)
		if err != nil {
			continue
		}
		alertes = append(alertes, &alerte)
	}
	return alertes, nil
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