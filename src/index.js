import express from 'express';
import log from "npmlog"
import path from 'path';
import fs from 'fs';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { ProcessorService } from './services/processor.service.js';
import { StreetViewerService } from './services/streeviewer.service.js';
import { SetupService } from './services/setup.service.js';

const app = express()
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://opensfmweb.envimap.hu',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 120000, 
  pingInterval: 50000, 
});

app.use(express.json());
app.use(cors());

const port = process.env.PORT;

io.on('connection', (socket) => {
  console.log(`Egy felhasználó csatlakozott: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Felhasználó lecsatlakozott: ${socket.id}`);
  });
});

app.post('/process_images', async (req, res) => {
  try {
    const { targetFolder, processingMode } = req.body || {};
    // log.info("🔥Image path🔥:", req.body);
    
    if (!targetFolder || typeof targetFolder !== 'string') {
      return res.status(400).send({ error: "targetFolder is missing or is not a string in the request body" });
    }

    const sourceDirectory = process.env.SOURCE_DIRECTORY;
    const fullSourcePath = path.join(sourceDirectory, targetFolder);

    if (!fs.existsSync(fullSourcePath)) {
      log.warn("⚠️ A forrásmappa nem található: ", fullSourcePath);
      return res.status(404).send({ error: `A forrásmappa nem található: ${fullSourcePath}` });
    }
    
    // Mappa létrehozása a feldolgozáshoz
    const tmpDataModule = ProcessorService.createFolder("process_directory");

    try {
      io.emit('status', { status: 'Initializing setup' });
      SetupService.initialize(tmpDataModule, processingMode);

      io.emit('status', { status: 'Saving images from directory' });
      await StreetViewerService.saveImagesFromDirectory(tmpDataModule, targetFolder);

      io.emit('status', { status: 'Initializing pipeline manager' });
      const pipeLineManager = ProcessorService.initializePipelineManager(tmpDataModule);

      io.emit('status', { status: 'Processing images' });
      const shots = await ProcessorService.process(pipeLineManager,targetFolder);

      const sanitizedFolderName = targetFolder.replace(/\//g, '_');
      const outputFolder = ProcessorService.createFolder(sanitizedFolderName);

      const reconstructionJson = path.join(tmpDataModule, 'reconstruction.json');
      const outputReconstructionJson = path.join(outputFolder, 'reconstruction.json');
      fs.copyFileSync(reconstructionJson, outputReconstructionJson);

      const outputShots = path.join(outputFolder, 'shots.json');
      fs.writeFileSync(outputShots, JSON.stringify(shots, null, 2));

      io.emit('status', { status: 'Processing complete' });
      res.send(shots);
    } catch (error) {
      log.error("Error processing images:", error);
      fs.rmSync(tmpDataModule, { recursive: true, force: true });
      io.emit('error', 'Error processing images');
      res.status(500).send({ error: "Failed to process images", details: error.message });
    } finally {
      if (fs.existsSync(tmpDataModule)) {
        fs.rmSync(tmpDataModule, { recursive: true, force: true });
      }
    }
  } catch (error) {
    res.status(500).send({ error: "Failed to process images", details: error.message });
  }
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});