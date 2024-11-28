import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import log from "npmlog";

// .env fájl betöltése
dotenv.config();

export const StreetViewerService = {
    /**
      * Képek letöltése és mentése
      * @param {string} tmpDataModule A célmappa, amin belül az images mappába mentünk
      * @param {string} targetFolder A forrásmappa neve
      */
    saveImagesFromDirectory: async (tmpDataModule, targetFolder) => {
        const sourceDirectory = process.env.SOURCE_DIRECTORY;
        const fullSourcePath = path.join(sourceDirectory, targetFolder);

        if (!fs.existsSync(fullSourcePath)) {
            log.warn("⚠️ A forrásmappa nem található: ", fullSourcePath);
            throw new Error(`A forrásmappa nem található: ${fullSourcePath}`);
        }

        // Rekurzív képgyűjtő függvény
        const getAllImageFiles = (directory) => {
            let imageFiles = [];
            const items = fs.readdirSync(directory, { withFileTypes: true });
            for (const item of items) {
                if (item.isDirectory()) {
                    imageFiles = imageFiles.concat(getAllImageFiles(path.join(directory, item.name)));
                } else if (item.isFile() && /\.(jpg|jpeg|png)$/i.test(item.name)) {
                    imageFiles.push(path.join(directory, item.name));
                }
            }
            return imageFiles;
        };

        const imageFiles = getAllImageFiles(fullSourcePath);
        for (const imageFile of imageFiles) {
            const destPath = path.join(tmpDataModule, 'images', path.basename(imageFile));
            fs.copyFileSync(imageFile, destPath);
        }
    }
};
