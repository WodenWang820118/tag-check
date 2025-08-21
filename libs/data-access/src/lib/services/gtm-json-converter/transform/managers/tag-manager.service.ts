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
    const configs = this.buildRawTagConfigs(
      accountId,
      containerId,
      dataLayers,
      triggers,
      googleTagName,
      measurementId,
      isSendingEcommerceData
    );
    return this.assignTagIds(configs) as TagConfig[];
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

  // Build raw TagConfig objects without tagId
  private buildRawTagConfigs(
    accountId: string,
    containerId: string,
    dataLayers: DataLayer[],
    triggers: Trigger[],
    googleTagName: string,
    measurementId: string,
    isSendingEcommerceData: 'true' | 'false'
  ): Array<Omit<TagConfig, 'tagId'>> {
    // Base Tag objects
    const baseTags: Tag[] = dataLayers.map((dL) => ({
      name: dL.event,
      triggers: triggers.filter((t) => t.name === dL.event),
      parameters: this.preprocessParameters(dL.paths)
    }));

    // GA4 configuration tag
    const configTag = this.googleTag.createGA4Configuration(
      googleTagName,
      measurementId,
      accountId,
      containerId
    );

    // Event tags
    const eventTags = baseTags.map((tag) =>
      this.eventTag.createTag(
        googleTagName,
        accountId,
        containerId,
        tag,
        triggers,
        isSendingEcommerceData
      )
    );

    // Video and scroll tags
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

    return [configTag, ...eventTags, ...videoTags, ...scrollTags];
  }

  // Assign sequential tagIds
  private assignTagIds<T>(items: T[]): Array<T & { tagId: string }> {
    return items.map(
      (item, idx) =>
        ({
          ...item,
          tagId: String(idx + 1)
        }) as T & { tagId: string }
    );
  }
}
