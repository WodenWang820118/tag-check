import { DataLayer, Parameter, Tag, TagConfig, Trigger } from '@utils';
import { Injectable } from '@angular/core';
import { EventTag } from '../tags/event-tag.service';
import { GoogleTag } from '../tags/google-tag.service';
import { ScrollTag } from '../tags/scroll-tag.service';
import { VideoTag } from '../tags/video-tag.service';
import { EventUtils } from '../../utils/event-utils.service';

const ECOMMERCE_PREFIX = 'ecommerce.';

/**
 * Builds the container's tags: the Google tag first, then one GA4 event tag
 * per custom data layer event, then the video and scroll tags when the specs
 * ask for them. Tag IDs are positions in that order, starting at "1".
 */
@Injectable({
  providedIn: 'root'
})
export class TagManager {
  constructor(
    private readonly eventTag: EventTag,
    private readonly googleTag: GoogleTag,
    private readonly scrollTag: ScrollTag,
    private readonly videoTag: VideoTag,
    private readonly eventUtils: EventUtils
  ) {}

  /**
   * @param triggers the trigger names and IDs from
   * {@link TriggerManager.createTriggers}, which the tags fire on.
   */
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
    return this.assignTagIds(configs);
  }

  /**
   * One event parameter per data layer path. GA4 reads ecommerce parameters
   * from the `ecommerce` object, so `ecommerce.currency` is sent as
   * `currency`; other paths keep their full name.
   */
  private preprocessParameters(paths: string[]): Parameter[] {
    return paths.map((path) => ({
      type: 'v',
      key: path.startsWith(ECOMMERCE_PREFIX)
        ? path.slice(ECOMMERCE_PREFIX.length)
        : path,
      value: path
    }));
  }

  private buildRawTagConfigs(
    accountId: string,
    containerId: string,
    dataLayers: DataLayer[],
    triggers: Trigger[],
    googleTagName: string,
    measurementId: string,
    isSendingEcommerceData: 'true' | 'false'
  ): Array<Omit<TagConfig, 'tagId'>> {
    // Scroll and video events get the dedicated tags below instead.
    const baseTags: Tag[] = dataLayers
      .filter((dL) => !this.eventUtils.isBuiltInEvent(dL.event))
      .map((dL) => ({
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
      triggers,
      dataLayers
    );
    const scrollTags = this.scrollTag.createScrollTag(
      googleTagName,
      accountId,
      containerId,
      triggers,
      dataLayers
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
