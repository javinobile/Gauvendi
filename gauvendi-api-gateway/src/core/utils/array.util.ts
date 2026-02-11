export abstract class ArrayUtil {
  public static generateCharactersFrom(startChar: string, length: number): string[] {
    const alphabet = 26; // Total characters (A-Z)

    function charToIndex(char: string): number {
      let index = 0;
      for (let i = 0; i < char.length; i++) {
        index *= alphabet;
        index += char.charCodeAt(i) - 65 + 1;
      }
      return index - 1;
    }

    const startIndex = charToIndex(startChar);

    return Array.from({ length }, (_, i) => {
      let index = startIndex + i;

      if (index >= alphabet) {
        const firstChar = String.fromCharCode(65 + Math.floor(index / alphabet) - 1);
        const secondChar = String.fromCharCode(65 + (index % alphabet));
        return firstChar + secondChar;
      }

      return String.fromCharCode(65 + index);
    });
  }

  public static insertEmptyStrings<T>(arr: T[], totalEmptyString: number): T[] {
    const result: T[] = [];

    arr.forEach((item, index) => {
      result.push(item);

      result.push(...Array(totalEmptyString).fill(""));
    });

    return result;
  }

  public static duplicateStrings<T>(arr: T[], totalDuplicate: number): T[] {
    const result: T[] = [];

    arr.forEach((item, index) => {
      result.push(item);

      result.push(...Array(totalDuplicate).fill(item));
    });

    return result;
  }

  public static cloneArray<T>(arr: T[], times: number) {
    let result: T[] = [];

    for (let i = 0; i < times; i++) {
      result.push(...arr);
    }

    return result;
  }

  public static removeDuplicateById<T extends { id: string | number }>(array: T[]): T[] {
    const seen = new Set<string | number>();
    return array.filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }

  public static generateEmptyArray(total: number, value: any = "") {
    return Array.from(new Array(total)).map(() => value);
  }
}
