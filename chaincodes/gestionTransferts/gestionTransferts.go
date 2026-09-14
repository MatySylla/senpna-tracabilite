package main

import (
"encoding/json"
"fmt"

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

func (s *SmartContract) InitierTransfert(
ctx contractapi.TransactionContextInterface,
idTransfert string,
idLot string,
expediteur string,
destinataire string,
quantite int,
bonLivraison string) error {

existant, err := ctx.GetStub().GetState(idTransfert)
if err != nil {
return fmt.Errorf("erreur lecture : %v", err)
}
if existant != nil {
return fmt.Errorf("transfert %s existe déjà", idTransfert)
}

ts, _ := ctx.GetStub().GetTxTimestamp()
transfert := Transfert{
IdTransfert:      idTransfert,
IdLot:            idLot,
Expediteur:       expediteur,
Destinataire:     destinataire,
Quantite:         quantite,
BonLivraison:     bonLivraison,
Statut:           "En attente",
Horodatage:       fmt.Sprintf("%d", ts.Seconds),
DateConfirmation: "",
}

transfertJSON, err := json.Marshal(transfert)
if err != nil {
return err
}
return ctx.GetStub().PutState(idTransfert, transfertJSON)
}

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

func (s *SmartContract) ConfirmerReception(
ctx contractapi.TransactionContextInterface,
idTransfert string) error {

transfert, err := s.GetTransfert(ctx, idTransfert)
if err != nil {
return err
}
if transfert.Statut != "En attente" {
return fmt.Errorf("transfert %s n'est pas en attente", idTransfert)
}

transfert.Statut = "Confirmé"
ts, _ := ctx.GetStub().GetTxTimestamp()
transfert.DateConfirmation = fmt.Sprintf("%d", ts.Seconds)

transfertJSON, err := json.Marshal(transfert)
if err != nil {
return err
}
return ctx.GetStub().PutState(idTransfert, transfertJSON)
}

func (s *SmartContract) RejeterTransfert(
ctx contractapi.TransactionContextInterface,
idTransfert string,
motif string) error {

transfert, err := s.GetTransfert(ctx, idTransfert)
if err != nil {
return err
}
if transfert.Statut != "En attente" {
return fmt.Errorf("impossible de rejeter — statut : %s", transfert.Statut)
}

transfert.Statut = "Rejeté — " + motif
ts, _ := ctx.GetStub().GetTxTimestamp()
transfert.DateConfirmation = fmt.Sprintf("%d", ts.Seconds)

transfertJSON, err := json.Marshal(transfert)
if err != nil {
return err
}
return ctx.GetStub().PutState(idTransfert, transfertJSON)
}

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
if transfert.IdTransfert != "" {
transferts = append(transferts, &transfert)
}
}
return transferts, nil
}

func main() {
chaincode, err := contractapi.NewChaincode(&SmartContract{})
if err != nil {
fmt.Printf("Erreur : %v", err)
return
}
if err := chaincode.Start(); err != nil {
fmt.Printf("Erreur démarrage : %v", err)
}
}
