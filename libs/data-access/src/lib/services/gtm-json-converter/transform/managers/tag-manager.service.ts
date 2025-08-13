import { DataLayer, Parameter, Tag, TagConfig, Trigger } from '@utils';
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
    private readonly eventTag: EventTag,
    private readonly googleTag: GoogleTag,
    private readonly scrollTag: ScrollTag,
    private readonly videoTag: VideoTag
  ) {}
  getTags(
    accountId: string,
    containerId: string,
    dataLayers: DataLayer[],
    triggers: Trigger[],
    googleTagName: string,
    measurementId: string,
    isSendingEcommerceData: 'true' | 'false'
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
        isSendingEcommerceData
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
