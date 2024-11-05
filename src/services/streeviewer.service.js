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
        try {
            const sourceDirectory = process.env.SOURCE_DIRECTORY;
            const fullSourcePath = path.join(sourceDirectory, targetFolder);

            log.info("SOURCEFOLDER: ", fullSourcePath);

            if (!fs.existsSync(fullSourcePath)) {
                log.warn("⚠️ A forrásmappa nem található: ", fullSourcePath);
                throw new Error(`A forrásmappa nem található: ${fullSourcePath}`);
            }

            // Rekurzív képgyűjtő függvény
            const getAllImageFiles = (directory) => {
                let imageFiles = [];
                const items = fs.readdirSync(directory, { withFileTypes: true });

                items.forEach(item => {
                    const fullPath = path.join(directory, item.name);
                    if (item.isDirectory()) {
                        // Ha az elem egy mappa, rekurzívan hívjuk meg
                        imageFiles = imageFiles.concat(getAllImageFiles(fullPath));
                    } else if (item.isFile()) {
                        // Csak a kívánt képkiterjesztéseket mentjük
                        const ext = path.extname(item.name).toLowerCase();
                        if (['.jpg', '.jpeg'].includes(ext)) {
                            imageFiles.push(fullPath);
                        }
                    }
                });
                return imageFiles;
            };

            // Összes kép beolvasása a célmappából és almappáiból
            const imageFiles = getAllImageFiles(fullSourcePath);

            const imagesDirectory = path.join(tmpDataModule, 'images')

            // Képek mentése a zsírúj mappába
            const promises = imageFiles.map(file => {
                const destPath = path.join(imagesDirectory, path.basename(file));
                fs.copyFileSync(file, destPath);
                console.log(`Kép mentve: ${destPath}`);
                return destPath;
            });

            return promises;
        } catch (error) {
            console.error(error.message);
            throw error;
        }
    }
};
