import { Component, input, viewChild, ViewEncapsulation } from '@angular/core';
import {
  TransformService,
  EditorFacadeService,
  EsvEditorService,
  SpecExtractService,
  SetupConstructorService,
  UtilsService
} from '@data-access';
import { containerName, gtmId, tagManagerUrl } from './test-data';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ConversionSuccessDialogComponent } from '../conversion-success-dialog/conversion-success-dialog.component';
import { AdvancedExpansionPanelComponent } from '../advanced-expansion-panel/advanced-expansion-panel.component';
import { MatButtonModule } from '@angular/material/button';
import { GTMContainerConfig, GTMConfiguration, Spec } from '@utils';

@Component({
  selector: 'lib-functional-card',
  standalone: true,
  imports: [MatButtonModule, AdvancedExpansionPanelComponent],
  templateUrl: './functional-card.component.html',
  styleUrls: ['./functional-card.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FunctionalCardComponent {
  accordionContainer =
    viewChild.required<AdvancedExpansionPanelComponent>('accordionContainer');
  color = input<string>('primary');
  private readonly dataLayer: any[];

  constructor(
    private readonly transformService: TransformService,
    public dialog: MatDialog,
    public editorFacadeService: EditorFacadeService,
    private readonly setupConstructorService: SetupConstructorService,
    private readonly esvEditorService: EsvEditorService,
    private readonly specExtractService: SpecExtractService,
    private readonly utilsService: UtilsService
  ) {
    this.dataLayer = (window as any).dataLayer || [];
  }

  convertCode() {
    this.accordionContainer().accordion().closeAll();
    this.scrollToBottom();

    const inputJsonEditor = this.editorFacadeService.getInputJsonContent();
    const googleTagName = this.setupConstructorService.googleTagName$();
    const measurementId = this.setupConstructorService.measurementId$();
    const isSendingEcommerceData =
      this.setupConstructorService.isSendingEcommerceData$();
    const esvConent = this.esvEditorService.content$();
    let esvContent = null;
    let json: Spec[] = [];

    try {
      if (esvConent !== '') {
        esvContent = JSON.parse(esvConent) as {
          name: string;
          parameters: { [x: string]: string }[];
        }[];
        console.log('esvConent', esvConent);
      }
    } catch (error) {
      console.warn(error);
    }

    try {
      if (inputJsonEditor().state.doc.toString() === '') {
        this.openDialog({
          message: 'Please provide a valid JSON input.'
        });
        return;
      }

      json = this.specExtractService.preprocessInput(
        inputJsonEditor().state.doc.toString()
      );

      console.log('json', json);
    } catch (error) {
      const data = {
        message:
          String(error) || 'An error occurred while processing the input JSON.'
      };
      this.openDialog(data);
      console.error(error);
    }

    try {
      this.performConversion(
        json,
        googleTagName,
        measurementId,
        isSendingEcommerceData === true ? 'true' : 'false',
        esvContent || []
      );
    } catch (error) {
      const data = {
        message:
          String(error) || 'An error occurred while processing the input JSON.'
      };
      this.openDialog(data);
      console.error(error);
    }
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

    const { accountId, containerId } =
      this.utilsService.extractAccountAndContainerId(tagManagerUrl);

    const gtmContainerConfig: GTMContainerConfig = {
      accountId: accountId,
      containerId: containerId,
      containerName: containerName,
      gtmId: gtmId,
      specs: json
    };

    const result = this.transformService.convert(
      googleTagName,
      measurementId,
      gtmContainerConfig,
      isSendingEcommerceData,
      esvConent
    );
    this.postConversion(result);
  }

  postConversion(result: GTMConfiguration) {
    this.editorFacadeService.setOutputJsonContent(result);
    this.openSuccessConversionDialog(result);

    this.dataLayer.push({
      event: 'btn_convert_click'
    });
  }

  openDialog(data: { message: string }): void {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        message: data.message
      }
    });
  }

  openSuccessConversionDialog(configuration: GTMConfiguration): void {
    this.dialog.open(ConversionSuccessDialogComponent, {
      data: configuration
    });
  }
}
