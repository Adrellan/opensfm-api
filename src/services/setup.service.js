import fs from 'fs';
import path from 'path';
import log from 'npmlog';
import dotenv from 'dotenv';

dotenv.config();
const openSfmPath = process.env.DATA_PATH || "."

export const SetupService = {
    /**
     * Képek mappa létrehozása és szükséges fájlok másolása
     * @param {string} destFolder A zsírúj mappa, ahol a fájlok létrejönnek
     * @param {string} processingMode Melyik configgal dolgozzuk fel a képeket
     */
    initialize: (destFolder, processingMode) => {
        SetupService.createImagesFolder(destFolder);
        SetupService.copyConfig(destFolder, processingMode);
        SetupService.createJsFile(destFolder);
    },

    /**
     * Képek mappájának létrehozása
     * @param {string} destFolder A zsírúj mappa
     */
    createImagesFolder: (destFolder) => {
        const imagesPath = path.join(destFolder, 'images');
        fs.mkdirSync(imagesPath, { recursive: true });
        log.info("✅ Images mappa létrehozva:", imagesPath);
    },

    /**
     * Konfigurációs fájl másolása
     * @param {string} destFolder A zsírúj mappa
     * @param {string} processingMode A módszer
     */
    copyConfig: (destFolder, processingMode) => {
        const configFilePath = openSfmPath+`data/${processingMode}/config.yaml`;
        const destPath = path.join(destFolder, 'config.yaml');

        fs.copyFileSync(configFilePath, destPath);
        log.info("✅ Config fájl másolva:", destPath);
    },

    /**
     * Kamera felülírása
     * https://opensfm.org/docs/using.html
     * @param {string} destFolder A zsírúj mappa
     */
    createJsFile: (destFolder) => {
        const jsFilePath = path.join(destFolder, 'camera_models_overrides.json');
        const jsFileContent = JSON.stringify({
            all: {
                projection_type: "equirectangular",
                width: 5760,
                height: 2880
            }
        }, null, 4); // 4-es behúzással formázás

        fs.writeFileSync(jsFilePath, jsFileContent);
        log.info("✅ camera_models_overrides létrehozva:", jsFilePath);
    }
};
