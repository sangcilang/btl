import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  type ElectricityRevenueReportPayload,
  type ElectricityRevenueReportRow,
  createEmptyElectricityRevenueReport,
  createEmptyElectricityRevenueRow,
  downloadElectricityRevenueExcel
} from './logic';

type ElectricityRevenueRowField = Exclude<keyof ElectricityRevenueReportRow, 'id'>;

@Component({
  selector: 'app-electricity-revenue-report-editor',
  templateUrl: './editor.component.html'
})
export class ElectricityRevenueReportEditorComponent {
  @Input() title = '';
  @Input() disabled = false;
  @Input() value: ElectricityRevenueReportPayload = createEmptyElectricityRevenueReport();
  @Output() valueChange = new EventEmitter<ElectricityRevenueReportPayload>();

  handleRootChange(field: 'billingPeriod' | 'description', nextValue: string): void {
    this.emitValue({
      ...this.value,
      [field]: nextValue
    });
  }

  handleRowChange(rowId: string, field: ElectricityRevenueRowField, nextValue: string): void {
    this.emitValue({
      ...this.value,
      rows: this.value.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: nextValue
            }
          : row
      )
    });
  }

  addRow(): void {
    this.emitValue({
      ...this.value,
      rows: [
        ...this.value.rows,
        createEmptyElectricityRevenueRow({
          serialNumber: String(this.value.rows.length + 1)
        })
      ]
    });
  }

  removeRow(rowId: string): void {
    const nextRows = this.value.rows.filter((row) => row.id !== rowId);

    this.emitValue({
      ...this.value,
      rows:
        nextRows.length > 0
          ? nextRows
          : [createEmptyElectricityRevenueRow({ serialNumber: '1' })]
    });
  }

  exportExcel(): void {
    downloadElectricityRevenueExcel(this.value, this.title || 'Bảng chi tiết doanh thu điện');
  }

  private emitValue(nextValue: ElectricityRevenueReportPayload): void {
    this.valueChange.emit(nextValue);
  }
}
