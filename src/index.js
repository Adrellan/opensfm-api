
import express from 'express';
import { ProcessorService } from './services/processor.service.js';
import { StreetViewerService } from './services/streeviewer.service.js';
import { SetupService } from './services/setup.service.js';
import log from "npmlog"
import path from 'path';

const app = express()

app.use(express.json());

const port = process.env.PORT;

app.post('/process_images', async (req, res) => {
  const { targetFolders } = req.body || {};
  log.info("🔥Image paths🔥:", req.body);

  if (!targetFolders || !Array.isArray(targetFolders)) {
      return res.status(400).send({ error: "targetFolders is missing or is not an array in the request body" });
  }

  // Mappa létrehozása a feldolgozáshoz
  const tmpDataModule = ProcessorService.createFolder();

  // Mappa tartalmának beállítása
  SetupService.initialize(tmpDataModule);

  // Képek mentése a megadott forrásmappából, egyesével hívva a saveImagesFromDirectory-t
  for (const folder of targetFolders) {
      await StreetViewerService.saveImagesFromDirectory(tmpDataModule, folder);
  }

  res.send({ success: true, processedFolders: targetFolders });
});

app.listen(port, () => {
  console.log(`🔥 API listening on http://0.0.0.0:${port}`)
})