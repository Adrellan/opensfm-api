import { execSync } from "child_process"
import log from "npmlog"
import path from "path";



const BIN_OPENSFM = process.env.BIN_OPENSFM
const openSfmPath = process.env.DATA_PATH || "."
export class OpenSFMPipe {




    /**
     * 
     * @param {"extract_metadata" | "detect_features" | "match_features" | "create_tracks" | "reconstruct" | "mesh" | "undistort" | "compute_depthmaps"}
     * command Opensfm parancs (extract, reconstruct, etc... )
     */

    constructor(command) {
        this._command = command;
    }

    /**
     * 
     * @param {string} dataset egy adott dataset  
     * @param {OpenSFMPipe} next Következő pip
     */
    run(dataset) {


        try{
            log.info(`OpenSFM_${this._command}`, "Command begin to executed...");

            const datasetPath = path.join(openSfmPath, dataset)
            log.info(datasetPath)
            // pl bin/opensfm extract_metadat data/berlin
            const output = execSync(`${BIN_OPENSFM} ${this._command} ${datasetPath}`, { encoding: "utf-8", stdio:"inherit"})
    
            log.verbose(output);

            return output;

        }
        catch(e){
            //log.error("Error", e)
            throw e;
        }
      

    }

      /**
     * 
     * @param {"extract_metadata" | "detect_features" | "match_features" | "create_tracks" | "reconstruct" | "mesh" | "undistort" | "compute_depthmaps"}
     * command Opensfm parancs (extract, reconstruct, etc... )
     */
    static create(command){
        return new this(command);
    }


}