import path from "path"
import { PipelineManager } from "../models/pipeline.js"
import { OpenSFMPipe } from "../models/opensfm_pipe.js"
import log from "npmlog"
import { readFileSync } from "fs"
import fs from 'fs';
import { createBearing, createUpVector, createViewingDirection, createCameraMatrix, _enuToGeodetic, createOpticalCenter } from "./math.js"
import dotenv from 'dotenv';
import { info } from "console"

dotenv.config();
const openSfmPath = process.env.DATA_PATH || "."



export const ProcessorService = {
    /**
     * 
     * @returns {string} Mappa létrehozása a feldolgozáshoz
     */
    createFolder: () => {
        const nowString = new Date().toLocaleDateString().replaceAll("/", "_")
        const tmpDataModule = path.join(openSfmPath, "data", nowString)
        log.info("🔥tmpDataModule🔥: ",tmpDataModule)

        if (!fs.existsSync(tmpDataModule)) {
            fs.mkdirSync(tmpDataModule, { recursive: true });
        } else {
            log.warn("⚠️ Mappa már létezik: ", tmpDataModule);
        }
        return tmpDataModule;
    },

    /**
     * @param {string} dataset 
     * @returns {PipelineManager} pipelineManager
     */
    initializePipelineManager: (dataset) => {
        log.info("Pipeline manager being initialized...")
        const pipelineManager = new PipelineManager(dataset)
            .addPipe(OpenSFMPipe.create("extract_metadata"))
            .addPipe(OpenSFMPipe.create("detect_features"))
            .addPipe(OpenSFMPipe.create("match_features"))
            .addPipe(OpenSFMPipe.create("create_tracks"))
            .addPipe(OpenSFMPipe.create("reconstruct"))

        log.info(`Pipeline manager inited with commands: ${pipelineManager.getPipeCommands()}`)
        return pipelineManager;
    },

    /**
     * 
     * @param {PipelineManager} pipelineManager 
     */
    process: (pipelineManager) => {

        log.info("Pipeline manager being executed")
        pipelineManager.execute();

        if (pipelineManager.errors.length > 0) {
            //log.error("PipelineError", pipelineManager.errors)
            throw new Error("Errors happened in pipeline manager")
        } 
        log.info("Pipeline manager executed")

        log.verbose("Reading reconstruction.json as a result...")

        const reconstrionFile = readFileSync(path.join(pipelineManager._dataset, "reconstruction.json"), { encoding: "utf8" })
        const reconstrionJson = JSON.parse(reconstrionFile);

        let allShots = {}

        // Clusterneként gyüjstsük össze az összes shotokat
        reconstrionJson.forEach(item => {
            const {shots} = item;
            allShots = {...allShots, ...shots}
        });

        log.verbose("Number of shots of the reconstruction: " + allShots.length)

        const reference_lla = readFileSync(path.join(pipelineManager._dataset, "reference_lla.json"), { encoding: "utf8" })
        const reference = JSON.parse(reference_lla);
        log.info("Reference LLA: ", reference)

        const result = []
        for(const [key, shot] of Object.entries(allShots)){
            const vd = createViewingDirection(shot.rotation);
            const rt = createCameraMatrix(shot.rotation, shot.translation);
            const upVector = createUpVector(shot.orientation, rt);
            const computed_compass_angle = createBearing(vd, upVector);

            const rotation = shot.rotation;
            const translation = shot.translation;
            const opticalCenter = createOpticalCenter(rotation, translation);
            const [clng, clat, calt] = _enuToGeodetic(opticalCenter, reference);
            const computed_altitude = calt;
            const computed_geometry = {
              lat: clat,
              lng: clng,
            };

            const item = {
                id:key,
                gps_position: shot.gps_position,
                computed_compass_angle,
                computed_altitude,
                computed_geometry,
                // gps_dop: shot.gps_dop
            }
            result.push(item)
        }

        return result;

    },
}
