import { AsyncPipe } from '@angular/common';
import { Component, input, viewChild, ViewEncapsulation } from '@angular/core';
import {
  TransformService,
  EditorFacadeService,
  EsvEditorService,
  SpecExtractService,
  SetupConstructorService
} from '@data-access';
import { combineLatest, take, tap } from 'rxjs';
import { containerName, gtmId, tagManagerUrl } from './test-data';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ConversionSuccessDialogComponent } from '../conversion-success-dialog/conversion-success-dialog.component';
import { AdvancedExpansionPanelComponent } from '../advanced-expansion-panel/advanced-expansion-panel.component';
import { MatButtonModule } from '@angular/material/button';
import { Spec } from '@utils';

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
    private transformService: TransformService,
    public dialog: MatDialog,
    public editorFacadeService: EditorFacadeService,
    private setupConstructorService: SetupConstructorService,
    private esvEditorService: EsvEditorService,
    private specExtractService: SpecExtractService
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
      this.setupConstructorService.getIsSendingEcommerceData(),
      this.esvEditorService.getEsvContent()
    ])
      .pipe(
        take(1),
        tap(
          ([
            inputJsonEditor,
            googleTagName,
            measurementId,
            includeItemScopedVariables,
            isSendingEcommerceData,
            esvConent
          ]) => {
            try {
              const json = this.specExtractService.preprocessInput(
                inputJsonEditor.state.doc.toString()
              );

              console.log('json', json);
              console.log('esvConent', esvConent);

              const esvContent = JSON.parse(esvConent) as {
                name: string;
                parameters: { [x: string]: string }[];
              }[];

              this.performConversion(
                json,
                googleTagName,
                measurementId,
                isSendingEcommerceData === true ? 'true' : 'false',
                esvContent
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
    json: Spec[],
    googleTagName: string,
    measurementId: string,
    isSendingEcommerceData: 'true' | 'false',
    esvConent: {
      name: string;
      parameters: { [x: string]: string }[];
    }[]
  ) {
    this.editorFacadeService.setInputJsonContent(json);
    // TODO: refactor: handle the logic directly without another function
    const gtmConfigGenerator = this.setupConstructorService.generateGtmConfig(
      json,
      tagManagerUrl,
      containerName,
      gtmId
    );

    const result = this.transformService.convert(
      googleTagName,
      measurementId,
      gtmConfigGenerator,
      isSendingEcommerceData,
      esvConent
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
