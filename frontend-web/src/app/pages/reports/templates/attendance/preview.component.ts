import { Component, Input } from '@angular/core';
import { createEmptyAttendanceReport, type AttendanceReportPayload, downloadAttendanceExcel } from './logic';

@Component({
  selector: 'app-attendance-report-preview',
  templateUrl: './preview.component.html'
})
export class AttendanceReportPreviewComponent {
  @Input() title = '';
  @Input() emptyMessage = 'Chưa có dòng chấm công nào.';
  @Input() showExportButton = true;
  @Input() payload: AttendanceReportPayload = createEmptyAttendanceReport();

  exportExcel(): void {
    downloadAttendanceExcel(this.payload, this.title);
  }
}
