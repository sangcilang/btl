import { Component, Input } from '@angular/core';
import {
  createEmptyElectricityRevenueReport,
  downloadElectricityRevenueExcel,
  type ElectricityRevenueReportPayload
} from './logic';

@Component({
  selector: 'app-electricity-revenue-report-preview',
  templateUrl: './preview.component.html'
})
export class ElectricityRevenueReportPreviewComponent {
  @Input() title = '';
  @Input() emptyMessage = 'Chưa có dòng doanh thu điện nào.';
  @Input() showExportButton = true;
  @Input() payload: ElectricityRevenueReportPayload = createEmptyElectricityRevenueReport();

  exportExcel(): void {
    downloadElectricityRevenueExcel(this.payload, this.title);
  }
}
