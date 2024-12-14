import {
  DataLayer,
  EventSettingsVariable,
  Parameter,
  Tag,
  TagConfig,
  Trigger
} from '@utils';
import { Injectable } from '@angular/core';
import { EventTag } from '../tags/event-tag.service';
import { GoogleTag } from '../tags/google-tag.service';
import { ScrollTag } from '../tags/scroll-tag.service';
import { VideoTag } from '../tags/video-tag.service';

@Injectable({
  providedIn: 'root'
})
export class TagManager {
  constructor(
    private eventTag: EventTag,
    private googleTag: GoogleTag,
    private scrollTag: ScrollTag,
    private videoTag: VideoTag
  ) {}
  getTags(
    accountId: string,
    containerId: string,
    dataLayers: DataLayer[],
    triggers: Trigger[],
    googleTagName: string,
    measurementId: string,
    isSendingEcommerceData: 'true' | 'false',
    esvContent: EventSettingsVariable[]
  ): TagConfig[] {
    const preprocessedTags: Tag[] = dataLayers.map((dL) => {
      return {
        name: dL.event,
        triggers: triggers.filter((trigger) => trigger.name === dL.event),
        parameters: this.preprocessParameters(dL.paths)
      };
    });

    const configTag = this.googleTag.createGA4Configuration(
      googleTagName,
      measurementId,
      accountId,
      containerId
    );

    const tags = preprocessedTags.map((tag) => {
      return this.eventTag.createTag(
        googleTagName,
        accountId,
        containerId,
        tag,
        triggers,
        isSendingEcommerceData,
        esvContent
      );
    });

    const videoTags = this.videoTag.createVideoTag(
      googleTagName,
      accountId,
      containerId,
      triggers
    );

    const scrollTags = this.scrollTag.createScrollTag(
      googleTagName,
      accountId,
      containerId,
      triggers
    );

    return [configTag, ...tags, ...videoTags, ...scrollTags].map(
      (_data, index) => ({
        ..._data,
        tagId: (index + 1).toString()
      })
    );
  }

  private preprocessParameters(paths: string[]): Parameter[] {
    return paths.map((path) => {
      return {
        type: 'v',
        key: path.includes('ecommerce') ? path.split('.')[1] : path,
        value: path
      };
    });
  }
}
