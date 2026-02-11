import { lastValueFrom } from "rxjs";
import { ResponseContentStatusEnum } from "../dtos/common.dto";
import { chunk } from "lodash";

export const snakeToCamel = (field: string) => {
  return field.replace(/(_([a-z]))/g, (match, firstChar) => {
    return firstChar.toUpperCase();
  });
};

export const formatOriginalFileName = (name: string) => {
  return name.trim().replaceAll(" ", "-").toLowerCase();
};

export const formatToUrlencoded = (details) => {
  return Object.keys(details)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(details[key])}`)
    .join("&");
};
export const customParamsSerializer = (params) => {
  const queryParts: string[] = [];

  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const value = params[key];
      if (Array.isArray(value)) {
        for (const item of value) {
          queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
        }
      } else {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
  }
  return queryParts.join("&");
};

export const splitArrayIntoChunks = (array, chunkSize) => {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

export const groupByKey = (data, key: string) => {
  return data?.reduce((acc, obj) => {
    const groupKey = obj[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(obj);
    return acc;
  }, {});
};

export function checkDateType(dateString: string) {
  const fullDateTimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{1}$/;
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

  if (fullDateTimePattern.test(dateString)) {
    return "DATE_TIME";
  } else if (dateOnlyPattern.test(dateString)) {
    return "DATE";
  } else {
    return "INVALID";
  }
}

export function formatDateVN(date: string) {
  if (!date) {
    return null;
  }
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function generatePluralText(text: string, occ: number) {
  return occ > 1 ? `${text}s` : text;
}

export function extractNumberFromStr(str) {
  return `${str}`.replace(/[^\d.-]/g, "");
}

export function extractPureNumberFromStr(str: string): number {
  if (!str) return 0;

  // Check if string contains percentage
  if (str.includes("%")) {
    // Remove % and convert to decimal
    const number = parseFloat(str.replace(/[^\d.-]/g, ""));
    return number / 100;
  }

  // Original logic for non-percentage values
  return parseFloat(str.replace(/[^\d.-]/g, ""));
}

export function removeDoubleQuotes(str: string): string {
  if (!str) return str;

  // Remove double quotes
  let result = str.replace(/"/g, "");

  // Replace unusual string values with 0
  result = result.replace(/\b(null|undefined|NaN)\b/gi, "0");

  return result;
}

export function convertExcelColumn(formula: string, newColumn: string): string {
  if (!formula || !newColumn) return formula;

  // Regex to match Excel cell references like A1, B2, C10, etc.
  const cellReferenceRegex = /([A-Z]+)(\d+)/g;

  return formula.replace(cellReferenceRegex, (match, column, row) => {
    return `${newColumn}${row}`;
  });
}

export function convertExcelColumns(formula: string, columnMappings: Record<string, string>): string {
  if (!formula || !columnMappings) return formula;

  // Regex to match Excel cell references like A1, B2, C10, etc.
  const cellReferenceRegex = /([A-Z]+)(\d+)/g;

  return formula.replace(cellReferenceRegex, (match, column, row) => {
    // If the column has a mapping, use it; otherwise keep the original column
    const newColumn = columnMappings[column] || column;
    return `${newColumn}${row}`;
  });
}

export function convertExcelRow(formula: string, newRow: number): string {
  if (!formula || newRow === undefined || newRow === null) return formula;

  // Regex to match Excel cell references like A1, B2, C10, etc.
  const cellReferenceRegex = /([A-Z]+)(\d+)/g;

  return formula.replace(cellReferenceRegex, (match, column, row) => {
    return `${column}${newRow}`;
  });
}

export function convertExcelSumRange(formula: string, startRow: number, endRow: number): string {
  if (!formula || startRow === undefined || endRow === undefined) return formula;

  // Regex to match SUM ranges like SUM(A1:A10), SUM(B5:B20), etc.
  const sumRangeRegex = /SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/g;

  return formula.replace(sumRangeRegex, (match, startCol, startRowNum, endCol, endRowNum) => {
    // Ensure both columns are the same (SUM ranges should be in the same column)
    if (startCol !== endCol) {
      return match; // Return original if columns don't match
    }
    return `SUM(${startCol}${startRow}:${endCol}${endRow})`;
  });
}

export function convertExcelRowByColumn(formula: string, columnRowMappings: Record<string, number>): string {
  if (!formula || !columnRowMappings) return formula;

  // Regex to match Excel cell references like A1, B2, C10, etc.
  const cellReferenceRegex = /([A-Z]+)(\d+)/g;

  return formula.replace(cellReferenceRegex, (match, column, row) => {
    // If the column has a row mapping, use it; otherwise keep the original row
    const newRow = columnRowMappings[column];
    if (newRow !== undefined && newRow !== null) {
      return `${column}${newRow}`;
    }
    return match; // Keep original if no mapping found
  });
}

export const responseV2Mutation = (response: any) => {
  return ({
    status: ResponseContentStatusEnum.SUCCESS,
    data: response
  })
};

export async function chunkedRpcRequest<TPayload, TResult>(
  params: {
    list?: string[];
    chunkSize: number;
    payloadBuilder: (chunk?: string[]) => TPayload;
    sender: (payload: TPayload) => any;
  }
): Promise<TResult[]> {
  const { list, chunkSize, payloadBuilder, sender } = params;

  if (!list?.length) {
    return await lastValueFrom(sender(payloadBuilder()));
  }

  const chunks = chunk(list, chunkSize);

  const results = await Promise.all(
    chunks.map((c) =>
      lastValueFrom(sender(payloadBuilder(c)))
    )
  );

  return results.flat();
}