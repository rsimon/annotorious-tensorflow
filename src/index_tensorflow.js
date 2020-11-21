import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as deeplab from '@tensorflow-models/deeplab';
import { v4 as uuid } from 'uuid';
import { Annotorious } from '@recogito/annotorious';

import '@recogito/annotorious/dist/annotorious.min.css';

const toAnnotation = prediction => {
  const { bbox } = prediction;

  return {
    "@context": "http://www.w3.org/ns/anno.jsonld",
    "id": `#${uuid()}`,
    "type": "Annotation",
    "body": [{
      "type": "TextualBody",
      "purpose": "tagging",
      "value": prediction['class']
    }],
    "target": {
      "selector": [{
        "type": "FragmentSelector",
        "conformsTo": "http://www.w3.org/TR/media-frags/",
        "value": `xywh=pixel:${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`
      }]
    }
  };
}

const segment = async () => {
  const img = document.getElementById("image");

  // Set to your preferred model: 'pascal', 'cityscapes' or 'ade20k'
  console.time("loading segmentation model");
  const model = await deeplab.load({ base: "ade20k", quantizationBytes: 2 });
  console.timeEnd("loading segmentation model");

  console.time("segmenting");
  const segments = await model.segment(img);
  console.timeEnd("segmenting");

  const mask = new ImageData(segments.segmentationMap, segments.width, segments.height);

  const ctx = document.getElementById("canvas").getContext("2d");
  ctx.putImageData(mask, 0, 0);
}

const detectObjects = async () => {
  const img = document.getElementById("image");

  console.time("loading object detection model");
  const model = await cocoSsd.load();
  console.time("loading object detection model");

  console.time("predicting objects")
  const predictions = await model.detect(img);
  console.time("predicting objects")
  
  const anno = new Annotorious({ 
    image: img,
    widgets: ['TAG']
  });
  anno.setAnnotations(predictions.map(p => toAnnotation(p)));
}

// Run
(async () => {
  detectObjects();
  segment();
})();