import express from 'express';
import { ProcessorService } from './services/processor.service.js';
import { StreetViewerService } from './services/streeviewer.service.js';
import { SetupService } from './services/setup.service.js';
import log from "npmlog"
import path from 'path';
import fs from 'fs';

const app = express()

app.use(express.json());

const port = process.env.PORT;

app.post('/process_images', async (req, res) => {
  try {
    const { targetFolder } = req.body || {};
    log.info("🔥Image paths🔥:", req.body);

    if (!targetFolder || typeof targetFolder !== 'string') {
        return res.status(400).send({ error: "targetFolder is missing or is not a string in the request body" });
    }

    // Mappa létrehozása a feldolgozáshoz
    const tmpDataModule = ProcessorService.createFolder("process_directory");

    // Mappa tartalmának beállítása
    SetupService.initialize(tmpDataModule);

    // Képek mentése a targetFolder-ből
    await StreetViewerService.saveImagesFromDirectory(tmpDataModule, targetFolder);

    const pipeLineManager = ProcessorService.initializePipelineManager(tmpDataModule);
    const shots = await ProcessorService.process(pipeLineManager);

    const sanitizedFolderName = targetFolder.replace(/\//g, '_');
    
    const outputFolder = ProcessorService.createFolder(targetFolder);

    //a tmpDataModule mappából mentsük el a reconstruction.json-t az outputFolder mappába bele
    const reconstructionJson = path.join(tmpDataModule, 'reconstruction.json');
    const outputReconstructionJson = path.join(outputFolder, 'reconstruction.json');
    fs.copyFileSync(reconstructionJson, outputReconstructionJson);

    // amit visszaad a shots, azt is mentsük el a targetFolder mappába
    const outputShots = path.join(outputFolder, 'shots.json');
    fs.writeFileSync(outputShots, JSON.stringify(shots, null, 2));

    // töröljük a tmpDataModule mappát
    fs.rmSync(tmpDataModule, { recursive: true, force: true });

    res.send(shots);
  } catch (error) {
    log.error("Error processing images:", error);
    res.status(500).send({ error: "Failed to process images", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`🔥 API listening on http://0.0.0.0:${port}`)
})