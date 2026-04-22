import { Injectable } from '@angular/core';
import { DataLayer, StrictDataLayerEvent } from '@utils';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class DataLayerUtils {
  constructor(private readonly utilsService: UtilsService) {}
  getDataLayers(specs: StrictDataLayerEvent[]) {
    const dataLayers: DataLayer[] = [];
    for (const { event, ...rest } of specs) {
      const paths = this.utilsService.getAllObjectPaths(rest);
      const uniquedPaths = Array.from(new Set(paths));
      const filtered = uniquedPaths.filter(
        (dL) => !dL.includes('items.0') && dL !== 'ecommerce'
      );
      dataLayers.push({ event, paths: filtered });
    }
    return dataLayers;
  }
}
