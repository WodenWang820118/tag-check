import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { XlsxSidenavComponent } from './xlsx-sidenav.component';
import { EventBusService } from '../../../services/event-bus/event-bus.service';
import { EditorService } from '../../services/editor/editor.service';
import { WebWorkerService } from '../../../services/web-worker/web-worker.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

describe('XlsxSidenavFormComponent', () => {
  let component: XlsxSidenavComponent;
  let fixture: ComponentFixture<XlsxSidenavComponent>;

  const mockEventBusService = {
    on: jest.fn(),
  };

  const mockWebWorkerService = {
    onMessage: jest.fn(),
    postMessage: jest.fn(),
  };

  const mockEditorService = {
    setContent: jest.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        XlsxSidenavComponent,
        MatSidenavModule,
        MatButtonModule,
        MatFormFieldModule,
        MatCardModule,
        FormsModule,
        ReactiveFormsModule,
        MatSelectModule,
        CommonModule,
        MatInputModule,
        MatIconModule,
        MatTooltipModule,
        MatTableModule,
      ],
      providers: [
        { provide: EventBusService, useValue: mockEventBusService },
        { provide: WebWorkerService, useValue: mockWebWorkerService },
        { provide: EditorService, useValue: mockEditorService },
      ],
    });
    fixture = TestBed.createComponent(XlsxSidenavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should toggle the sidenav when openDrawer is called', () => {
  //   const spy = jest.spyOn(component.sidenav as MatSidenav, 'toggle');
  //   component.openDrawer();
  //   expect(spy).toHaveBeenCalled();
  // });

  // it('should load an XLSX file', () => {
  //   const file = new File(['content'], 'sample.xlsx');
  //   component.loadXlsxFile(file);
  //   expect(component.fileName$.value).toBe('sample.xlsx');
  //   // You might also check if webWorkerService.postMessage has been called or other behaviors
  // });

  // it('should process data from the web worker', () => {
  //   // Here, you might need to mock data and check if the component variables (like workbook$, worksheetNames$) are set as expected
  // });

  // it('should switch to the selected sheet', () => {
  //   const mockEvent = { target: { value: 'sampleSheet' } };
  //   // Mocking the workbook$ value for the sake of this test
  //   component.workbook$.next('mockWorkbook');
  //   component.switchToSelectedSheet(mockEvent);
  //   // Check if webWorkerService.postMessage has been called with expected parameters
  // });

  // it('should retrieve specs from the source', () => {
  //   component.retrieveSpecsFromSource();
  //   // Check if webWorkerService.postMessage has been called with expected parameters
  // });

  // it('should process and set specs content', () => {
  //   const mockData = [{}]; // You'd provide mock data here
  //   component.processAndSetSpecsContent(mockData);
  //   // Check if editorService.setContent has been called with expected parameters
  // });

  // it('should filter GTM specs from data', () => {
  //   const mockData = [{}]; // You'd provide mock data here
  //   const result = component.filterGtmSpecsFromData(mockData);
  //   // expect(result).toEqual(/*expected value*/);
  // });

  // it('should convert spec string to object', () => {
  //   const mockSpec = "window.dataLayer.push({'event': 'testEvent'})";
  //   const result = component.convertSpecStringToObject({ specKey: mockSpec });
  //   expect(result).toEqual({ event: 'testEvent' });
  // });
});
