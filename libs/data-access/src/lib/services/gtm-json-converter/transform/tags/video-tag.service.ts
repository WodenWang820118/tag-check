import {
  EventTagConfig,
  HTMLTagConfig,
  TagConfig,
  TagTypeEnum,
  Trigger,
  DataLayer
} from '@utils';
import { EventUtils } from '../../utils/event-utils.service';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';

@Injectable({
  providedIn: 'root'
})
export class VideoTag {
  // Constants for maintenance
  private static readonly TRIGGER_NAME = 'event youtube video';
  private static readonly EVENT_TAG_NAME = 'GA4 event - Video';
  private static readonly HTML_TAG_NAME = 'cHTML - Youtube iframe API script';
  private static readonly EVENT_NAME_TEMPLATE = 'video_{{Video Status}}';
  private static readonly HTML_SCRIPT_SRC =
    '<script src="https://www.youtube.com/iframe_api">\n';
  private static readonly EVENT_FINGERPRINT = '1690374452646';
  private static readonly HTML_FINGERPRINT = '1689848944995';

  constructor(
    private readonly parameterUtils: ParameterUtils,
    private readonly eventUtils: EventUtils
  ) {}
  // Build the GA4 video event tag
  private buildEventTag(
    configurationName: string,
    accountId: string,
    containerId: string,
    triggerId: string
  ): EventTagConfig {
    return {
      accountId,
      containerId,
      name: VideoTag.EVENT_TAG_NAME,
      type: TagTypeEnum.GAAWE,
      parameter: [
        this.parameterUtils.createBooleanParameter(
          'sendEcommerceData',
          'false'
        ),
        this.parameterUtils.createTemplateParameter(
          'eventName',
          VideoTag.EVENT_NAME_TEMPLATE
        ),
        this.parameterUtils.createBuiltInListParameter('eventSettingsTable', [
          this.parameterUtils.createMapParameter(
            'video_current_time',
            '{{Video Current Time}}'
          ),
          this.parameterUtils.createMapParameter(
            'video_duration',
            '{{Video Duration}}'
          ),
          this.parameterUtils.createMapParameter(
            'video_percent',
            '{{Video Percent}}'
          ),
          this.parameterUtils.createMapParameter(
            'video_provider',
            '{{Video Provider}}'
          ),
          this.parameterUtils.createMapParameter(
            'video_title',
            '{{Video Title}}'
          ),
          this.parameterUtils.createMapParameter('video_url', '{{Video URL}}'),
          this.parameterUtils.createMapParameter('visible', '{{Video Visible}}')
        ]),
        this.parameterUtils.createTemplateParameter(
          'measurementIdOverride',
          '{{Measurement ID}}'
        )
      ],
      fingerprint: VideoTag.EVENT_FINGERPRINT,
      firingTriggerId: [triggerId],
      tagFiringOption: 'ONCE_PER_EVENT',
      monitoringMetadata: { type: 'MAP' },
      consentSettings: { consentStatus: 'NOT_SET' }
    };
  }

  // Build the HTML script tag for YouTube API
  private buildHtmlTag(
    configurationName: string,
    accountId: string,
    containerId: string,
    triggerId: string
  ): HTMLTagConfig {
    return {
      accountId,
      containerId,
      name: VideoTag.HTML_TAG_NAME,
      type: TagTypeEnum.HTML,
      parameter: [
        this.parameterUtils.createTemplateParameter(
          'html',
          VideoTag.HTML_SCRIPT_SRC
        ),
        this.parameterUtils.createBooleanParameter(
          'supportDocumentWrite',
          'false'
        )
      ],
      fingerprint: VideoTag.HTML_FINGERPRINT,
      firingTriggerId: [triggerId],
      tagFiringOption: 'ONCE_PER_EVENT',
      monitoringMetadata: { type: 'MAP' },
      consentSettings: { consentStatus: 'NOT_SET' }
    };
  }

  /**
   * Creates video event and HTML script tags if video events are present
   * @param configurationName GTM configuration reference
   * @param accountId GTM account ID
   * @param containerId GTM container ID
   * @param triggers Available triggers to match
   * @param dataLayers DataLayer events to inspect
   */
  public createVideoTag(
    configurationName: string,
    accountId: string,
    containerId: string,
    triggers: Trigger[],
    dataLayers: DataLayer[] = []
  ): TagConfig[] {
    try {
      if (!this.eventUtils.isIncludeVideo(dataLayers)) {
        return [];
      }
      const trigger = triggers.find((t) => t.name === VideoTag.TRIGGER_NAME);
      if (!trigger?.triggerId) {
        throw new Error("Couldn't find matching trigger for video tag");
      }
      const eventTag = this.buildEventTag(
        configurationName,
        accountId,
        containerId,
        trigger.triggerId
      );
      const htmlTag = this.buildHtmlTag(
        configurationName,
        accountId,
        containerId,
        trigger.triggerId
      );
      return [eventTag, htmlTag];
    } catch (error) {
      console.error('Error while creating video tag:', error);
      return [];
    }
  }
}
