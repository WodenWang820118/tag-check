import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { catchError, distinctUntilChanged, finalize, of, switchMap, take } from 'rxjs';
import {
  DataLayerSpec,
  ItemDef,
  Recording,
  StrictDataLayerEvent
} from '@utils';
import { EditorComponent } from '../../../../shared/components/editor/editor.component';
import {
  EditableJsonPanelState,
  ReportDetailRouteContext
} from '../report-detail.contracts';
import { ReportDetailPanelsFacadeService } from './report-detail-panels-facade.service';
import { ReportDetailPanelsViewComponent } from './report-detail-panels-view.component';

function stringifyJson(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }

  return JSON.stringify(value, null, 2);
}

function parseJson<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function isValidSpecContent(
  spec: StrictDataLayerEvent | null
): spec is StrictDataLayerEvent {
  return !!spec && typeof spec.event === 'string' && spec.event.trim().length > 0;
}

function normalizeItemDefContent(
  value: unknown,
  fallbackItemId: string,
  fallbackTemplateName = ''
): ItemDef | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if ('fullItemDef' in (value as Record<string, unknown>)) {
    const itemDef = value as Partial<ItemDef>;
    return {
      itemId: itemDef.itemId ?? fallbackItemId,
      templateName: itemDef.templateName ?? fallbackTemplateName,
      fullItemDef: itemDef.fullItemDef ?? {}
    };
  }

  return {
    itemId: fallbackItemId,
    templateName: fallbackTemplateName,
    fullItemDef: value
  };
}

@Component({
  selector: 'app-report-detail-panels',
  standalone: true,
  imports: [
    ReportDetailPanelsViewComponent,
    EditorComponent
  ],
  providers: [ReportDetailPanelsFacadeService],
  template: `
    @if (context()) {
      <app-report-detail-panels-view
        [specPanel]="specPanelState()"
        [recordingPanel]="recordingPanelState()"
        [itemDefPanel]="itemDefPanelState()"
        [rawRequest]="rawRequest()"
        [dataLayerContent]="dataLayerContent()"
        (specToggleEdit)="toggleSpecEdit()"
        (specUploadRequested)="onSpecFileSelected($event)"
        (specSaveRequested)="saveSpec()"
        (specCancelRequested)="cancelSpecEdit()"
        (recordingToggleEdit)="toggleRecordingEdit()"
        (recordingUploadRequested)="onRecordingFileSelected($event)"
        (recordingSaveRequested)="saveRecording()"
        (recordingCancelRequested)="cancelRecordingEdit()"
        (itemDefToggleEdit)="toggleItemDefEdit()"
        (itemDefUploadRequested)="onItemDefFileSelected($event)"
        (itemDefSaveRequested)="saveItemDef()"
        (itemDefCancelRequested)="cancelItemDefEdit()"
      >
        @if (specEditMode()) {
          <app-editor
            spec-editor
            [editorExtension]="'specJson'"
            [content]="specDraftText()"
            (contentChange)="onSpecDraftChange($event)"
            (syntaxErrorChange)="specSyntaxError.set($event)"
          ></app-editor>
        }

        @if (recordingEditMode()) {
          <app-editor
            recording-editor
            [editorExtension]="'recordingJson'"
            [content]="recordingDraftText()"
            (contentChange)="onRecordingDraftChange($event)"
            (syntaxErrorChange)="recordingSyntaxError.set($event)"
          ></app-editor>
        }

        @if (itemDefEditMode()) {
          <app-editor
            item-def-editor
            [editorExtension]="'itemDefJson'"
            [content]="itemDefDraftText()"
            (contentChange)="onItemDefDraftChange($event)"
            (syntaxErrorChange)="itemDefSyntaxError.set($event)"
          ></app-editor>
        }
      </app-report-detail-panels-view>
    }
  `
})
export class ReportDetailPanelsComponent {
  private readonly destroyRef = inject(DestroyRef);

  context = input<ReportDetailRouteContext | undefined>(undefined);

  specContent = signal<DataLayerSpec | null>(null);
  specDraftText = signal('');
  specEditMode = signal(false);
  specSyntaxError = signal(false);
  specLoading = signal(false);

  recordingContent = signal<Recording | null>(null);
  recordingDraftText = signal('');
  recordingEditMode = signal(false);
  recordingSyntaxError = signal(false);
  recordingLoading = signal(false);

  itemDefContent = signal<ItemDef | null>(null);
  itemDefDraftText = signal('');
  itemDefEditMode = signal(false);
  itemDefSyntaxError = signal(false);
  itemDefLoading = signal(false);
  editItemId = signal('');
  editTemplateName = signal('');

  itemDefLookupId = computed(() => this.specContent()?.dataLayerSpec.event ?? '');
  rawRequest = computed(() => this.context()?.reportDetails?.rawRequest ?? '');
  dataLayerContent = computed(() =>
    stringifyJson(this.context()?.reportDetails?.dataLayer)
  );

  specPanelState = computed<EditableJsonPanelState>(() => ({
    title: 'Data Layer Spec',
    content: stringifyJson(this.specContent()?.dataLayerSpec),
    loading: this.specLoading(),
    emptyMessage: 'No Spec found',
    editMode: this.specEditMode(),
    canSave: !this.specSyntaxError() && !!this.specDraftText().trim()
  }));

  recordingPanelState = computed<EditableJsonPanelState>(() => ({
    title: 'Chrome Recording',
    content: stringifyJson(this.recordingContent()),
    loading: this.recordingLoading(),
    emptyMessage: 'No recording found',
    editMode: this.recordingEditMode(),
    canSave: !this.recordingSyntaxError() && !!this.recordingDraftText().trim()
  }));

  itemDefPanelState = computed<EditableJsonPanelState>(() => ({
    title: 'Item Definition',
    content: stringifyJson(this.itemDefContent()?.fullItemDef),
    loading: this.itemDefLoading(),
    emptyMessage: 'No item definition found',
    editMode: this.itemDefEditMode(),
    canSave:
      !this.itemDefSyntaxError() &&
      !!this.itemDefDraftText().trim() &&
      !!this.editItemId().trim()
  }));

  constructor(
    private readonly reportDetailPanelsFacadeService: ReportDetailPanelsFacadeService
  ) {
    toObservable(this.context)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((context) => {
        if (!context) {
          return;
        }

        this.syncContext(context);
      });

    toObservable(this.itemDefLookupId)
      .pipe(
        distinctUntilChanged(),
        switchMap((itemId) => {
          if (!itemId) {
            this.itemDefLoading.set(false);
            return of(null);
          }

          this.itemDefLoading.set(true);
          return this.reportDetailPanelsFacadeService.getItemDefById(itemId).pipe(
            catchError(() => of(null)),
            finalize(() => this.itemDefLoading.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((itemDef) => {
        this.itemDefContent.set(itemDef);
        this.editItemId.set(itemDef?.itemId ?? this.itemDefLookupId());
        this.editTemplateName.set(itemDef?.templateName ?? '');

        if (!this.itemDefEditMode()) {
          this.itemDefDraftText.set(stringifyJson(itemDef?.fullItemDef));
          this.itemDefSyntaxError.set(false);
        }
      });
  }

  toggleSpecEdit() {
    this.specDraftText.set(stringifyJson(this.specContent()?.dataLayerSpec));
    this.specSyntaxError.set(false);
    this.specEditMode.update((value) => !value);
  }

  cancelSpecEdit() {
    this.specDraftText.set(stringifyJson(this.specContent()?.dataLayerSpec));
    this.specSyntaxError.set(false);
    this.specEditMode.set(false);
  }

  toggleRecordingEdit() {
    this.recordingDraftText.set(stringifyJson(this.recordingContent()));
    this.recordingSyntaxError.set(false);
    this.recordingEditMode.update((value) => !value);
  }

  cancelRecordingEdit() {
    this.recordingDraftText.set(stringifyJson(this.recordingContent()));
    this.recordingSyntaxError.set(false);
    this.recordingEditMode.set(false);
  }

  toggleItemDefEdit() {
    if (!this.itemDefEditMode()) {
      this.editItemId.set(this.itemDefContent()?.itemId ?? this.itemDefLookupId());
      this.editTemplateName.set(this.itemDefContent()?.templateName ?? '');
      this.itemDefDraftText.set(stringifyJson(this.itemDefContent()?.fullItemDef));
      this.itemDefSyntaxError.set(false);
    }

    this.itemDefEditMode.update((value) => !value);
  }

  cancelItemDefEdit() {
    this.editItemId.set(this.itemDefContent()?.itemId ?? this.itemDefLookupId());
    this.editTemplateName.set(this.itemDefContent()?.templateName ?? '');
    this.itemDefDraftText.set(stringifyJson(this.itemDefContent()?.fullItemDef));
    this.itemDefSyntaxError.set(false);
    this.itemDefEditMode.set(false);
  }

  async onSpecFileSelected(event: Event) {
    const file = this.getSelectedFile(event);
    if (!file) {
      return;
    }

    this.specLoading.set(true);
    try {
      const content = await this.reportDetailPanelsFacadeService.readFile(file);
      const parsed = parseJson<StrictDataLayerEvent>(content);

      this.specDraftText.set(parsed ? stringifyJson(parsed) : content);
      this.specSyntaxError.set(!isValidSpecContent(parsed));
    } finally {
      this.resetFileInput(event);
      this.specLoading.set(false);
    }
  }

  async onRecordingFileSelected(event: Event) {
    const file = this.getSelectedFile(event);
    if (!file) {
      return;
    }

    this.recordingLoading.set(true);
    try {
      const content = await this.reportDetailPanelsFacadeService.readFile(file);
      const parsed = parseJson<Recording>(content);

      this.recordingDraftText.set(parsed ? stringifyJson(parsed) : content);
      this.recordingSyntaxError.set(!parsed);
    } finally {
      this.resetFileInput(event);
      this.recordingLoading.set(false);
    }
  }

  async onItemDefFileSelected(event: Event) {
    const file = this.getSelectedFile(event);
    if (!file) {
      return;
    }

    this.itemDefLoading.set(true);
    try {
      const content = await this.reportDetailPanelsFacadeService.readFile(file);
      const parsed = parseJson<unknown>(content);
      const normalized = normalizeItemDefContent(
        parsed,
        this.editItemId() || this.itemDefLookupId(),
        this.editTemplateName()
      );

      this.itemDefDraftText.set(
        normalized ? stringifyJson(normalized.fullItemDef) : content
      );
      this.itemDefSyntaxError.set(!normalized);

      if (normalized) {
        this.editItemId.set(normalized.itemId);
        this.editTemplateName.set(normalized.templateName);
      }
    } finally {
      this.resetFileInput(event);
      this.itemDefLoading.set(false);
    }
  }

  saveSpec() {
    const context = this.context();
    const currentSpec = this.specContent();
    const parsed = parseJson<StrictDataLayerEvent>(this.specDraftText());

    if (!context || !currentSpec || !isValidSpecContent(parsed)) {
      return;
    }

    this.specLoading.set(true);
    this.reportDetailPanelsFacadeService
      .updateSpec(context.projectSlug, context.eventId, {
        event: parsed.event,
        dataLayerSpec: parsed
      })
      .pipe(
        take(1),
        finalize(() => this.specLoading.set(false))
      )
      .subscribe(() => {
        this.specContent.set({
          ...currentSpec,
          eventName: parsed.event,
          dataLayerSpec: parsed
        });
        this.specDraftText.set(stringifyJson(parsed));
        this.specSyntaxError.set(false);
        this.specEditMode.set(false);
      });
  }

  saveRecording() {
    const context = this.context();
    const parsed = parseJson<Recording>(this.recordingDraftText());

    if (!context || !parsed) {
      return;
    }

    this.recordingLoading.set(true);
    this.reportDetailPanelsFacadeService
      .updateRecording(context.projectSlug, context.eventId, parsed)
      .pipe(
        take(1),
        finalize(() => this.recordingLoading.set(false))
      )
      .subscribe(() => {
        this.recordingContent.set(parsed);
        this.recordingDraftText.set(stringifyJson(parsed));
        this.recordingSyntaxError.set(false);
        this.recordingEditMode.set(false);
      });
  }

  saveItemDef() {
    const parsed = parseJson<unknown>(this.itemDefDraftText());
    const itemId = this.editItemId().trim();
    const templateName = this.editTemplateName().trim();
    const normalized = normalizeItemDefContent(parsed, itemId, templateName);

    if (!normalized || !itemId) {
      return;
    }

    this.itemDefLoading.set(true);
    this.reportDetailPanelsFacadeService
      .updateItemDef(itemId, {
        fullItemDef: normalized.fullItemDef,
        templateName: templateName || undefined
      })
      .pipe(
        take(1),
        finalize(() => this.itemDefLoading.set(false))
      )
      .subscribe(() => {
        this.itemDefContent.set(normalized);
        this.itemDefDraftText.set(stringifyJson(normalized.fullItemDef));
        this.itemDefSyntaxError.set(false);
        this.itemDefEditMode.set(false);
      });
  }

  onSpecDraftChange(content: string) {
    this.specDraftText.set(content);
  }

  onRecordingDraftChange(content: string) {
    this.recordingDraftText.set(content);
  }

  onItemDefDraftChange(content: string) {
    this.itemDefDraftText.set(content);
  }

  private syncContext(context: ReportDetailRouteContext) {
    this.specContent.set(context.spec);
    this.specDraftText.set(stringifyJson(context.spec.dataLayerSpec));
    this.specSyntaxError.set(false);
    this.specEditMode.set(false);
    this.specLoading.set(false);

    this.recordingContent.set(context.recording);
    this.recordingDraftText.set(stringifyJson(context.recording));
    this.recordingSyntaxError.set(false);
    this.recordingEditMode.set(false);
    this.recordingLoading.set(false);

    this.itemDefContent.set(null);
    this.itemDefDraftText.set('');
    this.itemDefSyntaxError.set(false);
    this.itemDefEditMode.set(false);
    this.itemDefLoading.set(false);
    this.editItemId.set(context.spec.dataLayerSpec.event ?? '');
    this.editTemplateName.set('');
  }

  private getSelectedFile(event: Event): File | null {
    const target = event.target as HTMLInputElement | null;
    return target?.files?.[0] ?? null;
  }

  private resetFileInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (target) {
      target.value = '';
    }
  }
}
