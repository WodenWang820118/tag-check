import { EditorComponent } from '../../components/editor/editor.component';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FunctionalCardComponent } from '../../components/functional-card/functional-card.component';
import { UploadActionComponent } from '../../components/upload-action/upload-action.component';
import { PlanEditorActionComponent } from '../../components/plan-editor-action/plan-editor-action.component';
import { DeveloperGuideActionComponent } from '../../components/developer-guide-action/developer-guide-action.component';
import { FileUploadDialogComponent } from '../../components/file-upload-dialog/file-upload-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { EditorTypeEnum, GTMConfiguration, StrictDataLayerEvent } from '@utils';
import type { ProjectContainerImport } from '../../components/conversion-success-dialog/conversion-success-dialog.component';
import { JsonPipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import {
  TagBuildModeService,
  TagBuildMode,
  EditorFacadeService,
  SpecExtractService
} from '@data-access';
import { TagExtractComponent } from '../../components/tag-extract/tag-extract.component';

/**
 * tag-build's main view: the Tag Build and Tag Extract tabs with the input
 * and output JSON editors, the convert card and the spec upload.
 *
 * `projectImport` and `projectContainer` are optional host inputs. TagCheck
 * sets them through `NgComponentOutlet` so the built container can be
 * imported and Tag Extract can read the project's saved container. The
 * standalone site leaves both unset.
 */
@Component({
  selector: 'lib-tag-build-page',
  standalone: true,
  imports: [
    JsonPipe,
    FunctionalCardComponent,
    EditorComponent,
    MatTabsModule,
    UploadActionComponent,
    PlanEditorActionComponent,
    DeveloperGuideActionComponent,
    TagExtractComponent
  ],
  templateUrl: './tag-build-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagBuildPageComponent {
  specs = input.required<StrictDataLayerEvent[]>();
  projectSlug = input<string>();
  /**
   * Imports the built container into the host's project. See
   * {@link ProjectContainerImport}. Null when the host has no project.
   */
  projectImport = input<ProjectContainerImport | null>(null);
  /**
   * The project's saved container, for Tag Extract. Null when the host has
   * no project or the project has not imported a container.
   */
  projectContainer = input<GTMConfiguration | null>(null);
  inputExtension = EditorTypeEnum.INPUT_JSON;
  outputExtension = EditorTypeEnum.OUTPUT_JSON;

  // expose enum to template for comparisons
  readonly TagBuildMode = TagBuildMode;

  // two-way binding target for mat-tab-group selectedIndex
  get selectedIndex(): TagBuildMode {
    return this.tagBuildModeService.mode;
  }

  set selectedIndex(v: TagBuildMode) {
    this.tagBuildModeService.setMode(v ?? TagBuildMode.TagBuild);
  }

  constructor(
    private readonly dialog: MatDialog,
    private readonly tagBuildModeService: TagBuildModeService,
    private readonly editorFacadeService: EditorFacadeService,
    private readonly specExtractService: SpecExtractService
  ) {}

  onUpload() {
    this.openFileUploadDialog();
  }

  openFileUploadDialog() {
    this.dialog.open(FileUploadDialogComponent);
  }

  async openPlanEditorDialog(): Promise<void> {
    const { PlanEditorDialogComponent } =
      await import('../../components/plan-editor-dialog/plan-editor-dialog.component');
    this.dialog.open(PlanEditorDialogComponent, {
      width: '900px',
      maxWidth: '95vw'
    });
  }

  async openDeveloperGuideDialog(): Promise<void> {
    let currentSpecs: StrictDataLayerEvent[] = [];
    try {
      const inputContent = this.editorFacadeService?.inputJsonContent?.();
      if (
        inputContent &&
        typeof inputContent === 'string' &&
        inputContent.trim() !== ''
      ) {
        currentSpecs = this.specExtractService.preprocessInput(inputContent);
      }
    } catch {
      currentSpecs = [];
    }

    if (currentSpecs.length === 0 && this.specs() && this.specs().length > 0) {
      currentSpecs = this.specs();
    }

    const { DeveloperGuideDialogComponent } =
      await import('../../components/developer-guide-dialog/developer-guide-dialog.component');
    this.dialog.open(DeveloperGuideDialogComponent, {
      data: { specs: currentSpecs },
      width: '800px',
      maxWidth: '95vw'
    });
  }
}
