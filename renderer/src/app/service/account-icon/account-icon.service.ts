import { Injectable } from '@angular/core';
import blockies from 'ethereum-blockies';

@Injectable()
export class AccountIconService {

  constructor() {
  }

  public getIconBase64(address:string) {
    let icon = blockies.create({ // All options are optional
      seed: 'randstring', // seed used to generate icon data, default: random
      color: '#D1C4E9', // to manually specify the icon color, default: random
      bgcolor: '#673AB7', // choose a different background color, default: random
      size: 16, // width/height of the icon in blocks, default: 8
      scale: 4, // width/height of each block in pixels, default: 4
      spotcolor: '#B388FF' // each pixel has a 13% chance of being of a third color,
      // default: random. Set to -1 to disable it. These "spots" create structures
      // that look like eyes, mouths and noses.
    });
    return icon.toDataURL();
  }
}
