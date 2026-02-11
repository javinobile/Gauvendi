/**
 * Excel Configuration Interface
 * 
 * Định nghĩa cấu trúc config cho Excel operations
 */
export interface ExcelConfig {
  /** Maximum file size in bytes (default: 10MB) */
  maxFileSize: number;
  
  /** Allowed file extensions */
  allowedExtensions: string[];
  
  /** Batch size for bulk operations */
  batchSize: number;
  
  /** Path to template directory */
  templatePath: string;
  
  /** Default date format */
  defaultDateFormat: string;
  
  /** Enable streaming for large files */
  enableStreaming: boolean;
  
  /** Threshold for using streaming (number of rows) */
  streamingThreshold: number;
}

/**
 * Excel Column Configuration
 * 
 * Định nghĩa cấu trúc cho column config trong export/import
 */
export interface ExcelColumnConfig {
  /** Column key/field name */
  key: string;
  
  /** Display header */
  header: string;
  
  /** Column width */
  width?: number;
  
  /** Data format type */
  format?: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean';
  
  /** Is required field */
  required?: boolean;
  
  /** Custom validation function */
  validator?: (value: any) => boolean | string;
  
  /** Custom formatter function */
  formatter?: (value: any) => any;
  
  /** Custom parser function for import */
  parser?: (value: any) => any;
}

/**
 * Excel Export Options
 * 
 * Options cho export operations
 */
export interface ExcelExportOptions {
  /** Column configurations */
  columns: ExcelColumnConfig[];
  
  /** Worksheet name */
  sheetName?: string;
  
  /** Include header row */
  includeHeader?: boolean;
  
  /** Styling options */
  styling?: ExcelStyling;
  
  /** Auto-filter */
  autoFilter?: boolean;
  
  /** Freeze panes */
  freezePanes?: {
    row: number;
    column: number;
  };
  
  /** Template file path */
  templatePath?: string;
}

/**
 * Excel Import Options
 * 
 * Options cho import operations
 */
export interface ExcelImportOptions {
  /** Column configurations */
  columns?: ExcelColumnConfig[];
  
  /** Worksheet index or name */
  worksheet?: number | string;
  
  /** Header row number (default: 1) */
  headerRow?: number;
  
  /** Data start row (default: 2) */
  dataStartRow?: number;
  
  /** Skip empty rows */
  skipEmptyRows?: boolean;
  
  /** Validate before import */
  validate?: boolean;
  
  /** Stop on first error */
  stopOnError?: boolean;
  
  /** Max rows to import */
  maxRows?: number;
}

/**
 * Excel Styling Options
 * 
 * Styling configuration cho Excel export
 */
export interface ExcelStyling {
  /** Header background color (hex without #) */
  headerBackground?: string;
  
  /** Header font color (hex without #) */
  headerFontColor?: string;
  
  /** Header font size */
  headerFontSize?: number;
  
  /** Header bold */
  headerBold?: boolean;
  
  /** Alternate row colors */
  alternateRowColors?: {
    even: string;
    odd: string;
  };
  
  /** Border style */
  borders?: boolean | 'thin' | 'medium' | 'thick';
  
  /** Font family */
  fontFamily?: string;
  
  /** Font size */
  fontSize?: number;
}

/**
 * Excel Validation Result
 * 
 * Kết quả validation của Excel data
 */
export interface ExcelValidationResult {
  /** Is data valid */
  isValid: boolean;
  
  /** Total rows validated */
  totalRows: number;
  
  /** Number of errors */
  errorCount: number;
  
  /** Validation errors */
  errors: ExcelValidationError[];
  
  /** Warnings (non-critical issues) */
  warnings?: ExcelValidationWarning[];
}

/**
 * Excel Validation Error
 * 
 * Chi tiết lỗi validation
 */
export interface ExcelValidationError {
  /** Row number */
  row: number;
  
  /** Column key */
  field: string;
  
  /** Error message */
  message: string;
  
  /** Original value */
  value?: any;
  
  /** Error code */
  code?: string;
}

/**
 * Excel Validation Warning
 * 
 * Chi tiết warning
 */
export interface ExcelValidationWarning {
  /** Row number */
  row: number;
  
  /** Column key */
  field?: string;
  
  /** Warning message */
  message: string;
  
  /** Warning code */
  code?: string;
}

/**
 * Excel Import Result
 * 
 * Kết quả import operation
 */
export interface ExcelImportResult {
  /** Total rows processed */
  total: number;
  
  /** Successfully imported */
  successful: number;
  
  /** Failed imports */
  failed: number;
  
  /** Import errors */
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  
  /** Imported data */
  data?: any[];
  
  /** Processing time (ms) */
  processingTime?: number;
}

