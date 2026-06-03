'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./src/routes/auth.routes');
const lotsRoutes = require('./src/routes/lots.routes');
const transfertsRoutes = require('./src/routes/transferts.routes');
const alertesRoutes = require('./src/routes/alertes.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lots', lotsRoutes);
app.use('/api/transferts', transfertsRoutes);
app.use('/api/alertes', alertesRoutes);

// Route publique patient
app.get('/api/verify/:idLot', async (req, res) => {
    const { connectToFabric } = require('./src/fabric/gateway');
    let gateway;
    try {
        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionLots');
        const result = await contract.evaluateTransaction('VerifierAuthenticite', req.params.idLot);
        return res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
});

// Route test
app.get('/', (req, res) => {
    res.json({
        message: '✅ API SEN-PNA Blockchain — Opérationnelle',
        version: '1.0.0',
        channel: process.env.CHANNEL_NAME
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ API SEN-PNA démarrée sur http://localhost:${PORT}`);
});

module.exports = app;