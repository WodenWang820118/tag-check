import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataLayerSpec } from '@utils';
import {
  ReportDetailRouteContext,
  ReportTabViewModel
} from '../report-detail.contracts';
import { ReportDetailPanelsComponent } from '../report-detail-panels/report-detail-panels.component';
import { ReportTabComponent } from './report-tab.component';
import { ReportTabFacade } from './report-tab-facade.service';
import { ReportTabViewComponent } from './report-tab-view.component';

@Component({
  selector: 'app-report-tab-view',
  standalone: true,
  template: '<ng-content></ng-content>'
})
class MockReportTabViewComponent {
  viewModel = input.required<ReportTabViewModel>();
  copyEventName = output<void>();
  exportSpreadsheet = output<void>();
  exportRecording = output<void>();
  exportEvent = output<void>();
  openHistory = output<void>();
}

@Component({
  selector: 'app-report-detail-panels',
  standalone: true,
  template: ''
})
class MockReportDetailPanelsComponent {
  context = input<ReportDetailRouteContext | undefined>(undefined);
}

function createContext(): ReportDetailRouteContext {
  const spec: DataLayerSpec = {
    eventName: 'purchase',
    dataLayerSpec: {
      event: 'purchase'
    } as DataLayerSpec['dataLayerSpec'],
    rawGtmTag: {
      tag: {
        name: 'Purchase Tag'
      } as DataLayerSpec['rawGtmTag']['tag'],
      trigger: []
    }
  };

  return {
    projectSlug: 'storybook-project',
    eventId: 'evt-1',
    spec,
    recording: {
      title: 'Purchase recording',
      steps: []
    },
    reportDetails: {
      position: 0,
      event: 'purchase',
      eventId: 'evt-1',
      eventName: 'purchase',
      passed: false,
      requestPassed: false,
      destinationUrl: 'https://example.com',
      createdAt: new Date('2026-04-23T12:34:56.000Z'),
      updatedAt: new Date('2026-04-23T12:34:56.000Z'),
      message: 'The run failed.'
    } as ReportDetailRouteContext['reportDetails'],
    videoBlob: new Blob(['video'], { type: 'video/webm' }),
    imageBlob: new Blob(['image'], { type: 'image/png' }),
    fileReports: [
      {
        fileName: 'report.json',
        testEventDetails: [
          {
            eventId: 'evt-1'
          }
        ],
        testImage: []
      }
    ] as unknown as ReportDetailRouteContext['fileReports'],
    historyLinkCommands: ['..', 'buckets']
  };
}

describe('ReportTabComponent', () => {
  const facade = {
    copyEventName: vi.fn(),
    shareSpreadsheet: vi.fn(),
    exportRecording: vi.fn(),
    exportEvent: vi.fn()
  };
  const router = {
    navigate: vi.fn().mockResolvedValue(true)
  };

  beforeEach(async () => {
    facade.copyEventName.mockClear();
    facade.shareSpreadsheet.mockClear();
    facade.exportRecording.mockClear();
    facade.exportEvent.mockClear();
    router.navigate.mockClear();

    await TestBed.configureTestingModule({
      imports: [ReportTabComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: Router,
          useValue: router
        }
      ]
    })
      .overrideComponent(ReportTabComponent, {
        remove: {
          imports: [ReportTabViewComponent, ReportDetailPanelsComponent],
          providers: [ReportTabFacade]
        },
        add: {
          imports: [MockReportTabViewComponent, MockReportDetailPanelsComponent],
          providers: [
            {
              provide: ReportTabFacade,
              useValue: facade
            }
          ]
        }
      })
      .compileComponents();
  });

  it('threads explicit context into child panels and delegates share/export actions', () => {
    const fixture = TestBed.createComponent(ReportTabComponent);
    const context = createContext();

    fixture.componentRef.setInput('context', context);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const detailPanels = fixture.debugElement.query(
      By.directive(MockReportDetailPanelsComponent)
    ).componentInstance as MockReportDetailPanelsComponent;

    component.copyEventName();
    component.shareSpreadsheet();
    component.exportRecording();
    component.exportEvent();
    component.openHistory();

    expect(detailPanels.context()).toBe(context);
    expect(facade.copyEventName).toHaveBeenCalledWith('purchase');
    expect(facade.shareSpreadsheet).toHaveBeenCalledWith(
      'storybook-project',
      context.reportDetails
    );
    expect(facade.exportRecording).toHaveBeenCalledWith(
      'storybook-project',
      context.reportDetails,
      context.videoBlob
    );
    expect(facade.exportEvent).toHaveBeenCalledWith(
      'storybook-project',
      context.reportDetails,
      context.videoBlob
    );
    expect(router.navigate).toHaveBeenCalledWith(['..', 'buckets'], {
      queryParams: {
        event: 'purchase'
      }
    });
  });
});
