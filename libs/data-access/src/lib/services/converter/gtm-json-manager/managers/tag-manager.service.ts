import { Parameter, Tag, TagConfig, Trigger, TriggerConfig } from '@utils';
import { Injectable } from '@angular/core';
import { EventTag } from '../tags/event-tag.service';
import { GoogleTag } from '../tags/google-tag.service';
import { ScrollTag } from '../tags/scroll-tag.service';
import { VideoTag } from '../tags/video-tag.service';
import { EventUtils } from '../../utils/event-utils.service';

@Injectable({
  providedIn: 'root',
})
export class TagManager {
  constructor(
    private eventTag: EventTag,
    private googleTag: GoogleTag,
    private scrollTag: ScrollTag,
    private videoTag: VideoTag,
    private eventUtils: EventUtils
  ) {}
  tags: Tag[] = [];

  formatSingleTag(
    formattedParams: Parameter[],
    eventName: string,
    triggers: Trigger[]
  ) {
    if (this.eventUtils.isBuiltInEvent(eventName)) {
      return;
    }
    this.addTagIfNotExists(eventName, formattedParams, triggers);
  }

  addTagIfNotExists(
    eventName: string,
    formattedParams: Parameter[],
    triggers: Trigger[]
  ) {
    if (!this.tags.some((tag) => tag.name === eventName) && triggers) {
      this.tags.push({
        name: eventName,
        parameters: formattedParams,
        triggers: [triggers.find((trigger) => trigger.name === eventName)!],
      });
    }
  }

  getTags() {
    return this.tags;
  }

  getAllTags(
    googleTagName: string,
    measurementId: string,
    accountId: string,
    containerId: string,
    data: Record<string, string>[],
    triggers: TriggerConfig[],
    tags: Tag[],
    dataLayers: string[]
  ): TagConfig[] {
    return [
      // config tag
      this.googleTag.createGA4Configuration(
        googleTagName,
        measurementId,
        accountId,
        containerId
      ),
      // normal tags
      ...tags.map((tag) => {
        return this.eventTag.createTag(
          googleTagName,
          accountId,
          containerId,
          tag,
          dataLayers,
          triggers
        );
      }),
      // built-in tags. Currently only video and scroll
      ...this.videoTag.createVideoTag(
        googleTagName,
        accountId,
        containerId,
        data,
        triggers
      ),
      ...this.scrollTag.createScrollTag(
        googleTagName,
        accountId,
        containerId,
        data,
        triggers
      ),
    ].map((_data, index) => ({
      ..._data,
      tagId: (index + 1).toString(),
    }));
  }
}
