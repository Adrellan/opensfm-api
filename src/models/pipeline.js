import log from "npmlog";
import { OpenSFMPipe } from "./opensfm_pipe.js";

export class PipelineManager {
    constructor(dataset) {
        this._dataset = dataset;
        this._pipes = [];
        this.errors = [];
    }

    addPipe(pipe) {
        this._pipes.push(pipe);
        return this;
    }

    async execute() {
        for (const pipe of this._pipes) {
            try {
                if (typeof pipe === 'function') {
                    await pipe(this._dataset);
                } else {
                    pipe.run(this._dataset);
                }
            } catch (error) {
                this.errors.push({
                    command: pipe._command,
                    error,
                    output: null
                });
            }
        }
    }

    getPipeCommands() {
        return this._pipes.map(pipe => pipe._command).filter(command => command);
    }
}