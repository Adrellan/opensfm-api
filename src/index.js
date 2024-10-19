
import express from 'express';
import { ProcessorService } from './services/processor.service.js';
const app = express()


const port = process.env.PORT;


app.get('/process_images', (req, res) => {

    //const {image_ids} =     req.body;
    const dataset =         ProcessorService.saveImagesTmp();
    const pipeLineManager = ProcessorService.initializePipelineManager(dataset);
    const shots =           ProcessorService.process(pipeLineManager)

    res.send(shots)
})

app.listen(port, () => {
  console.log(`🔥 API listening on http://0.0.0.0:${port}`)
})