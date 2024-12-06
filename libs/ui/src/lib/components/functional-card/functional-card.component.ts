import { AsyncPipe } from '@angular/common';
import { Component, input, viewChild, ViewEncapsulation } from '@angular/core';
import {
  ConverterService,
  EditorFacadeService,
  SetupConstructorService,
  Utils
} from '@data-access';
import { combineLatest, take, tap } from 'rxjs';
import { containerName, gtmId, tagManagerUrl } from './test-data';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ConversionSuccessDialogComponent } from '../conversion-success-dialog/conversion-success-dialog.component';
import { AdvancedExpansionPanelComponent } from '../advanced-expansion-panel/advanced-expansion-panel.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'lib-functional-card',
  standalone: true,
  imports: [AsyncPipe, MatButtonModule, AdvancedExpansionPanelComponent],
  templateUrl: './functional-card.component.html',
  styleUrls: ['./functional-card.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FunctionalCardComponent {
  accordionContainer =
    viewChild.required<AdvancedExpansionPanelComponent>('accordionContainer');
  color = input<string>('primary');
  private dataLayer: any[];

  constructor(
    private converterService: ConverterService,
    public dialog: MatDialog,
    public editorFacadeService: EditorFacadeService,
    private setupConstructorService: SetupConstructorService,
    private utils: Utils
  ) {
    this.dataLayer = (window as any).dataLayer || [];
  }

  convertCode() {
    this.accordionContainer().accordion().closeAll();
    this.scrollToBottom();

    combineLatest([
      this.editorFacadeService.getInputJsonContent(),
      this.setupConstructorService.getGoogleTagName(),
      this.setupConstructorService.getMeasurementId(),
      this.setupConstructorService.getIncludeItemScopedVariables(),
      this.setupConstructorService.getIsSendingEcommerceData()
    ])
      .pipe(
        take(1),
        tap(
          ([
            inputJsonEditor,
            googleTagName,
            measurementId,
            includeItemScopedVariables,
            isSendingEcommerceData
          ]) => {
            try {
              const json = this.utils.preprocessInput(
                inputJsonEditor.state.doc.toString()
              );
              this.performConversion(
                json,
                googleTagName,
                measurementId,
                includeItemScopedVariables,
                isSendingEcommerceData === true ? 'true' : 'false'
              );
            } catch (error) {
              this.openDialog(error);
              console.error(error);
            }
          }
        )
      )
      .subscribe();
  }

  scrollToBottom() {
    try {
      // TODO: refactor
      const element = document.querySelector('.mat-drawer-content');
      if (element) {
        if (element.scrollHeight === element.clientHeight) {
          return;
        }
        element.scrollTo({
          top: element.scrollHeight - element.clientHeight,
          behavior: 'smooth'
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  performConversion(
    json: any,
    googleTagName: string,
    measurementId: string,
    includeItemScopedVariables: boolean,
    isSendingEcommerceData: 'true' | 'false'
  ) {
    // TODO: refactor

    this.editorFacadeService.setInputJsonContent(JSON.parse(json));
    const gtmConfigGenerator = this.setupConstructorService.generateGtmConfig(
      json,
      tagManagerUrl,
      containerName,
      gtmId
    );
    const result = this.converterService.convert(
      googleTagName,
      measurementId,
      gtmConfigGenerator,
      includeItemScopedVariables,
      isSendingEcommerceData
    );
    this.postConversion(result);
  }

  postConversion(result: any) {
    this.editorFacadeService.setOutputJsonContent(result);
    this.openSuccessConversionDialog(result);

    this.dataLayer.push({
      event: 'btn_convert_click'
    });
  }

  openDialog(data: any) {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        message: data.message
      }
    });
  }

  openSuccessConversionDialog(configuration: any) {
    this.dialog.open(ConversionSuccessDialogComponent, {
      data: configuration
    });
  }
}
