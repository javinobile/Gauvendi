import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ExcelService } from '../services/excel.service';
import * as ExcelJS from 'exceljs';

/**
 * Excel Service Unit Tests
 * 
 * Test suite cho ExcelService
 * Coverage: parseExcelFile, exportToExcel, validation
 */
describe('ExcelService', () => {
  let service: ExcelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelService],
    }).compile();

    service = module.get<ExcelService>(ExcelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseExcelFile', () => {
    it('should parse Excel file and return data array', async () => {
      // Create mock Excel file
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      // Add headers
      worksheet.addRow(['id', 'name', 'email']);
      
      // Add data
      worksheet.addRow([1, 'John Doe', 'john@example.com']);
      worksheet.addRow([2, 'Jane Smith', 'jane@example.com']);

      const buffer = await workbook.xlsx.writeBuffer();

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.byteLength,
        buffer: Buffer.from(buffer),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.parseExcelFile(mockFile);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should throw BadRequestException when file is null', async () => {
      await expect(service.parseExcelFile(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should skip empty rows when skipEmptyRows is true', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      worksheet.addRow(['id', 'name', 'email']);
      worksheet.addRow([1, 'John Doe', 'john@example.com']);
      worksheet.addRow([null, null, null]); // Empty row
      worksheet.addRow([2, 'Jane Smith', 'jane@example.com']);

      const buffer = await workbook.xlsx.writeBuffer();

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.byteLength,
        buffer: Buffer.from(buffer),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.parseExcelFile(mockFile, {
        skipEmptyRows: true,
      });

      expect(result).toHaveLength(2); // Should skip empty row
    });

    it('should respect maxRows option', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      worksheet.addRow(['id', 'name', 'email']);
      worksheet.addRow([1, 'John Doe', 'john@example.com']);
      worksheet.addRow([2, 'Jane Smith', 'jane@example.com']);
      worksheet.addRow([3, 'Bob Johnson', 'bob@example.com']);

      const buffer = await workbook.xlsx.writeBuffer();

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.byteLength,
        buffer: Buffer.from(buffer),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.parseExcelFile(mockFile, {
        maxRows: 2,
      });

      expect(result).toHaveLength(2); // Should only return 2 rows
    });
  });

  describe('exportToExcel', () => {
    it('should export data to Excel buffer', async () => {
      const data = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ];

      const options = {
        columns: [
          { key: 'id', header: 'ID', width: 10 },
          { key: 'name', header: 'Name', width: 20 },
          { key: 'email', header: 'Email', width: 30 },
        ],
      };

      const buffer = await service.exportToExcel(data, options);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Verify Excel content
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.worksheets[0];
      expect(worksheet.rowCount).toBe(3); // 1 header + 2 data rows
    });

    it('should throw BadRequestException when data is empty', async () => {
      const options = {
        columns: [
          { key: 'id', header: 'ID', width: 10 },
        ],
      };

      await expect(service.exportToExcel([], options)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should apply formatting when styling is provided', async () => {
      const data = [{ id: 1, name: 'Test' }];

      const options = {
        columns: [
          { key: 'id', header: 'ID', width: 10 },
          { key: 'name', header: 'Name', width: 20 },
        ],
        styling: {
          headerBackground: '4472C4',
          headerFontColor: 'FFFFFF',
          headerFontSize: 12,
          headerBold: true,
        },
      };

      const buffer = await service.exportToExcel(data, options);

      // Verify styling
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.worksheets[0];
      const headerRow = worksheet.getRow(1);
      const firstCell = headerRow.getCell(1);

      expect(firstCell.font?.bold).toBe(true);
      expect(firstCell.font?.size).toBe(12);
    });

    it('should apply auto-filter when enabled', async () => {
      const data = [{ id: 1, name: 'Test' }];

      const options = {
        columns: [
          { key: 'id', header: 'ID', width: 10 },
          { key: 'name', header: 'Name', width: 20 },
        ],
        autoFilter: true,
      };

      const buffer = await service.exportToExcel(data, options);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.worksheets[0];
      expect(worksheet.autoFilter).toBeDefined();
    });

    it('should use custom formatter for columns', async () => {
      const data = [{ id: 1, amount: 1000000 }];

      const options = {
        columns: [
          { key: 'id', header: 'ID', width: 10 },
          { 
            key: 'amount', 
            header: 'Amount', 
            width: 15,
            formatter: (value: number) => `${value.toLocaleString()} VND`
          },
        ],
      };

      const buffer = await service.exportToExcel(data, options);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.worksheets[0];
      const amountCell = worksheet.getRow(2).getCell(2);
      
      expect(amountCell.value).toBe('1,000,000 VND');
    });
  });

  describe('file validation', () => {
    it('should throw error for invalid file extension', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      await expect(service.parseExcelFile(mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error for file size exceeding limit', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 11 * 1024 * 1024, // 11MB
        buffer: Buffer.alloc(11 * 1024 * 1024),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      await expect(service.parseExcelFile(mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

