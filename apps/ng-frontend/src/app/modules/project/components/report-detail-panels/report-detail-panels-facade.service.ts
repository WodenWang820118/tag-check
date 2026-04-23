import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ItemDef, Recording } from '@utils';
import {
  SpecService,
  UpdateSpecRequest
} from '../../../../shared/services/api/spec/spec.service';
import { RecordingService } from '../../../../shared/services/api/recording/recording.service';
import { ItemDefService } from '../../../../shared/services/api/item-def/item-def.service';

@Injectable()
export class ReportDetailPanelsFacadeService {
  constructor(
    private readonly specService: SpecService,
    private readonly recordingService: RecordingService,
    private readonly itemDefService: ItemDefService
  ) {}

  readFile(file: File): Promise<string> {
    return file.text();
  }

  updateSpec(
    projectSlug: string,
    eventId: string,
    content: UpdateSpecRequest
  ): Observable<unknown> {
    return this.specService.updateSpec(projectSlug, eventId, content);
  }

  updateRecording(
    projectSlug: string,
    eventId: string,
    recording: Recording
  ): Observable<Recording> {
    return this.recordingService.updateRecording(projectSlug, eventId, recording);
  }

  getItemDefById(itemId: string): Observable<ItemDef> {
    return this.itemDefService.getItemDefById(itemId);
  }

  updateItemDef(itemId: string, itemDef: Partial<ItemDef>) {
    return this.itemDefService.updateItemDef(itemId, itemDef);
  }
}
