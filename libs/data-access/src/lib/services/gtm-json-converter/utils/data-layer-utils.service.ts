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
      const { event, ...rest } = spec as Record<string, unknown>;
      const paths = this.utilsService.getAllObjectPaths(
        rest as unknown as Record<string, unknown>
      );
      const uniquedPaths = Array.from(new Set(paths));
      const filtered = uniquedPaths.filter(
        (dL) => !dL.includes('items.0') && dL !== 'ecommerce'
      );
      dataLayers.push({ event: event as string, paths: filtered });
    }
    return dataLayers;
  }
}
