export class DataLayerManager {
  dataLayers: string[] = [];

  addDataLayer(paths: string[]) {
    const uniquePaths = this.filterDuplicates(paths, this.dataLayers);
    this.dataLayers.push(...uniquePaths);
  }

  filterDuplicates(paths: string[], dataLayers: string[]): string[] {
    return paths.filter((path) => !dataLayers.includes(path));
  }

  hasExistedDataLayer(dLReference: string, dataLayers: string[]) {
    return dataLayers.some((dL) => dL.includes(dLReference));
  }

  getDataLayers(includeItemScopedVariables: boolean): string[] {
    console.log('includeItemScopedVariables: ', includeItemScopedVariables);
    if (includeItemScopedVariables) {
      return this.dataLayers;
    }
    return this.dataLayers.filter((dL) => !dL.includes('ecommerce.items.0'));
  }
}
