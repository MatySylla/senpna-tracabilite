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

type Transfert struct {
	IdTransfert      string `json:"idTransfert"`
	IdLot            string `json:"idLot"`
	Expediteur       string `json:"expediteur"`
	Destinataire     string `json:"destinataire"`
	Quantite         int    `json:"quantite"`
	BonLivraison     string `json:"bonLivraison"`
	Statut           string `json:"statut"`
	Horodatage       string `json:"horodatage"`
	DateConfirmation string `json:"dateConfirmation"`
}

// InitierTransfert — Démarrer un transfert
func (s *SmartContract) InitierTransfert(
	ctx contractapi.TransactionContextInterface,
	idTransfert string,
	idLot string,
	expediteur string,
	destinataire string,
	quantite int,
	bonLivraison string) error {

	// Vérifier que le transfert n'existe pas déjà
	transfertExistant, err := ctx.GetStub().GetState(idTransfert)
	if err != nil {
		return fmt.Errorf("erreur lecture ledger : %v", err)
	}
	if transfertExistant != nil {
		return fmt.Errorf("transfert %s existe déjà", idTransfert)
	}

	transfert := Transfert{
		IdTransfert:      idTransfert,
		IdLot:            idLot,
		Expediteur:       expediteur,
		Destinataire:     destinataire,
		Quantite:         quantite,
		BonLivraison:     bonLivraison,
		Statut:           "En attente",
		Horodatage:       time.Now().Format(time.RFC3339),
		DateConfirmation: "",
	}

	transfertJSON, err := json.Marshal(transfert)
	if err != nil {
		return fmt.Errorf("erreur sérialisation : %v", err)
	}

	return ctx.GetStub().PutState(idTransfert, transfertJSON)
}

// GetTransfert — Consulter un transfert
func (s *SmartContract) GetTransfert(
	ctx contractapi.TransactionContextInterface,
	idTransfert string) (*Transfert, error) {

	transfertJSON, err := ctx.GetStub().GetState(idTransfert)
	if err != nil {
		return nil, fmt.Errorf("erreur lecture : %v", err)
	}
	if transfertJSON == nil {
		return nil, fmt.Errorf("transfert %s introuvable", idTransfert)
	}

	var transfert Transfert
	err = json.Unmarshal(transfertJSON, &transfert)
	if err != nil {
		return nil, err
	}
	return &transfert, nil
}

// ConfirmerReception — La PRA confirme la réception
func (s *SmartContract) ConfirmerReception(
	ctx contractapi.TransactionContextInterface,
	idTransfert string) error {

	transfert, err := s.GetTransfert(ctx, idTransfert)
	if err != nil {
		return err
	}

	if transfert.Statut != "En attente" {
		return fmt.Errorf("transfert %s n'est pas en attente — statut actuel : %s",
			idTransfert, transfert.Statut)
	}

	transfert.Statut = "Confirmé"
	transfert.DateConfirmation = time.Now().Format(time.RFC3339)

	transfertJSON, err := json.Marshal(transfert)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(idTransfert, transfertJSON)
}

// RejeterTransfert — Rejeter un transfert
func (s *SmartContract) RejeterTransfert(
	ctx contractapi.TransactionContextInterface,
	idTransfert string,
	motif string) error {

	transfert, err := s.GetTransfert(ctx, idTransfert)
	if err != nil {
		return err
	}

	if transfert.Statut != "En attente" {
		return fmt.Errorf("impossible de rejeter — statut actuel : %s",
			transfert.Statut)
	}

	transfert.Statut = "Rejeté — " + motif
	transfert.DateConfirmation = time.Now().Format(time.RFC3339)

	transfertJSON, err := json.Marshal(transfert)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(idTransfert, transfertJSON)
}

// GetAllTransferts — Lister tous les transferts
func (s *SmartContract) GetAllTransferts(
	ctx contractapi.TransactionContextInterface) ([]*Transfert, error) {

	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var transferts []*Transfert
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var transfert Transfert
		err = json.Unmarshal(queryResponse.Value, &transfert)
		if err != nil {
			continue
		}
		transferts = append(transferts, &transfert)
	}
	return transferts, nil
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