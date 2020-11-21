import * as MagicWand from 'magic-wand-tool';
import { v4 as uuid } from 'uuid';
import { Annotorious } from '@recogito/annotorious';

import '@recogito/annotorious/dist/annotorious.min.css';

const THRESHOLD = 70;

const toAnnotation = contours => {
  const points = contours.find(c => !c.inner)
    .points
    .map(p => `${p.x},${p.y}`)

  return {
    "@context": "http://www.w3.org/ns/anno.jsonld",
    "id": `#${uuid()}`,
    "type": "Annotation",
    "body": [{
      "type": "TextualBody",
      "purpose": "tagging",
      "value": "tag"
    }],
    "target": {
      "selector": [{
        "type": "SvgSelector",
        "value": `<svg><polygon points="${points.join(' ')}" /></svg>`
      }]
    }
  };
}

const onClick = img => evt => {
  // Read image data
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = img.width;
  ctx.canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  const image = {
    data: ctx.getImageData(0, 0, img.width, img.height).data,
    width: img.width,
    height: img.height,
    bytes: 4
  };

  let mask = MagicWand.floodFill(image, evt.x, evt.y, THRESHOLD, null);
  if (mask) 
    mask = MagicWand.gaussBlurOnlyBorder(mask, 5);
  
  const contours = MagicWand.traceContours(mask);
  const simple = toAnnotation(MagicWand.simplifyContours(contours, 2, 12));

  const anno = new Annotorious({ 
    image: document.getElementById('image'),
    widgets: ['TAG']
  });
  anno.setAnnotations([ simple ]);
  anno.selectAnnotation(simple);
}

const renderMask = mask=> {
  const ctx = document.getElementById("canvas").getContext("2d");
  ctx.putImageData(new ImageData(mask.data, mask.width, mask.height), 0, 0);
}

(function() {
  const img = document.getElementById("image");


  img.addEventListener('click', onClick(img));

})();