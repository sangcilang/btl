import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  type AttendanceReportPayload,
  type AttendanceReportRow,
  createEmptyAttendanceReport,
  createEmptyAttendanceRow,
  downloadAttendanceExcel
} from './logic';

type AttendanceRowField = Exclude<keyof AttendanceReportRow, 'id'>;

@Component({
  selector: 'app-attendance-report-editor',
  templateUrl: './editor.component.html'
})
export class AttendanceReportEditorComponent {
  @Input() title = '';
  @Input() disabled = false;
  @Input() value: AttendanceReportPayload = createEmptyAttendanceReport();
  @Output() valueChange = new EventEmitter<AttendanceReportPayload>();

  handleRootChange(field: 'reportPeriod' | 'description', nextValue: string): void {
    this.emitValue({
      ...this.value,
      [field]: nextValue
    });
  }

  handleRowChange(rowId: string, field: AttendanceRowField, nextValue: string): void {
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
      rows: [...this.value.rows, createEmptyAttendanceRow()]
    });
  }

  removeRow(rowId: string): void {
    const nextRows = this.value.rows.filter((row) => row.id !== rowId);

    this.emitValue({
      ...this.value,
      rows: nextRows.length > 0 ? nextRows : [createEmptyAttendanceRow()]
    });
  }

  exportExcel(): void {
    downloadAttendanceExcel(this.value, this.title || 'Báo cáo chấm công');
  }

  private emitValue(nextValue: AttendanceReportPayload): void {
    this.valueChange.emit(nextValue);
  }
}
