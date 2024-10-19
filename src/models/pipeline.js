import log from "npmlog";
import { OpenSFMPipe } from "./opensfm_pipe.js";





export class PipelineManager {


    constructor(dataset) {
        this.pipes = [];
        this.errors = []
        this._dataset = dataset
    }


    /**
     * 
     * @param {OpenSFMPipe} pipe 
     * @returns 
     */
    addPipe(pipe) {
        this.pipes.push(pipe)
        return this;
    }

    execute() {
        let output = "";
        for (const pipe of this.pipes) {
            const t1 = new Date();

            try {
                output = pipe.run(this._dataset);
            } catch (e) {
                this.errors.push({
                    command: pipe._command,
                    error: e,
                    output: output
                })
                return;
            }
            const delta = (new Date() - t1) / 1000;
            log.info("Time spent", `Pipe has ran in ${delta}s`)
        }
        log.verbose("Count", `Number of successfully ran pipes: ${this.errors.length}`)
        log.verbose("Count", `Number of errors: ${this.errors.length}`)

    }

    getPipeCommands(){
        return this.pipes.map(x=>x._command);
    }



}