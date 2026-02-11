export enum FieldTypeEnum {
  SINGLE_FIELD = 'SINGLE_FIELD',
  COLLECTION_FIELD = 'COLLECTION_FIELD',
}

export interface MappingField<T, U, K> {
  sourceData: U[];
  sourceKeyExtractor: (item: T) => K;
  targetKeyExtractor: (item: U) => K;
  setter: (target: T, value: U[] | U) => void;
  transformer?: (item: U) => any;
  keyType: any;
  fieldType: FieldTypeEnum;
}

export class CollectionMappingUtil {
  /**
   * Merges collections based on mapping configurations
   * @param targetList - The main list to merge data into
   * @param mappingFields - Configuration for how to merge each field
   */
  static mergeCollection<T>(targetList: T[], mappingFields: MappingField<T, any, any>[]): void {
    for (const mapping of mappingFields) {
      this.applyMapping(targetList, mapping);
    }
  }

  private static applyMapping<T, U, K>(
    targetList: T[],
    mapping: MappingField<T, U, K>
  ): void {
    // Create a map from source data for efficient lookup
    const sourceMap = new Map<K, U[]>();
    
    for (const sourceItem of mapping.sourceData) {
      const key = mapping.targetKeyExtractor(sourceItem);
      if (!sourceMap.has(key)) {
        sourceMap.set(key, []);
      }
      sourceMap.get(key)!.push(sourceItem);
    }

    // Apply mapping to each target item
    for (const targetItem of targetList) {
      const key = mapping.sourceKeyExtractor(targetItem);
      const sourceItems = sourceMap.get(key) || [];

      if (mapping.fieldType === FieldTypeEnum.COLLECTION_FIELD) {
        // Transform items if transformer is provided
        const transformedItems = mapping.transformer
          ? sourceItems.map(mapping.transformer)
          : sourceItems;
        
        mapping.setter(targetItem, transformedItems);
      } else if (mapping.fieldType === FieldTypeEnum.SINGLE_FIELD) {
        const firstItem = sourceItems[0];
        if (firstItem) {
          const transformedItem = mapping.transformer
            ? mapping.transformer(firstItem)
            : firstItem;
          
          mapping.setter(targetItem, transformedItem);
        }
      }
    }
  }

  /**
   * Helper method to create mapping field configuration
   */
  static createMappingField<T, U, K>(config: {
    sourceData: U[];
    sourceKeyExtractor: (item: T) => K;
    targetKeyExtractor: (item: U) => K;
    setter: (target: T, value: U[] | U) => void;
    transformer?: (item: U) => any;
    fieldType: FieldTypeEnum;
  }): MappingField<T, U, K> {
    return {
      sourceData: config.sourceData,
      sourceKeyExtractor: config.sourceKeyExtractor,
      targetKeyExtractor: config.targetKeyExtractor,
      setter: config.setter,
      transformer: config.transformer,
      keyType: String, // Default to string, can be overridden
      fieldType: config.fieldType,
    };
  }
}
