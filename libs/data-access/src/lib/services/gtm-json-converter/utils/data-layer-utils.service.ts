import { Injectable } from '@angular/core';
import { DataLayer, Spec } from '@utils';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class DataLayerUtils {
  constructor(private readonly utilsService: UtilsService) {}
  getDataLayers(specs: Spec[]) {
    const dataLayers: DataLayer[] = [];
    for (const spec of specs) {
      const { event, ...rest } = spec;
      const paths = this.utilsService.getAllObjectPaths(rest);
      const uniquedPaths = new Set(paths);
      dataLayers.push({
        event: event,
        paths: Array.from(uniquedPaths).filter(
          (dL) => !dL.includes('items.0') && !(dL === 'ecommerce')
        )
      });
    }
    return dataLayers;
  }
}
