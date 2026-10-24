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
import {
  CONSENT_STATUS_NOT_NEEDED,
  MEASUREMENT_ID_VARIABLE_NAME,
  VIDEO_TRIGGER_NAME
} from '../utils/constant';

/**
 * Builds the YouTube video tags: a GA4 event tag that sends
 * `video_<status>` (video_start, video_progress, video_complete) with the
 * built-in video variables, and a Custom HTML tag that loads the YouTube
 * iframe API. Both fire on the YouTube Video trigger.
 */
@Injectable({
  providedIn: 'root'
})
export class VideoTag {
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

  private buildEventTag(
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
        // The container defines the measurement ID as a Constant variable;
        // there is no variable named "Measurement ID" to refer to.
        this.parameterUtils.createTemplateParameter(
          'measurementIdOverride',
          `{{${MEASUREMENT_ID_VARIABLE_NAME}}}`
        )
      ],
      fingerprint: VideoTag.EVENT_FINGERPRINT,
      firingTriggerId: [triggerId],
      tagFiringOption: 'ONCE_PER_EVENT',
      monitoringMetadata: { type: 'MAP' },
      consentSettings: { consentStatus: CONSENT_STATUS_NOT_NEEDED }
    };
  }

  private buildHtmlTag(
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
      consentSettings: { consentStatus: CONSENT_STATUS_NOT_NEEDED }
    };
  }

  /**
   * Creates the video event and HTML script tags when a data layer event is
   * a video event. Returns an empty array otherwise, or when the
   * `event youtube video` trigger is missing.
   * @param configurationName name of the Google tag; not used, because the
   * event tag sets its measurement ID directly
   * @param accountId GTM account ID
   * @param containerId GTM container ID
   * @param triggers trigger names and IDs to find the YouTube Video trigger in
   * @param dataLayers DataLayer events to inspect
   */
  public createVideoTag(
    configurationName: string,
    accountId: string,
    containerId: string,
    triggers: Trigger[],
    dataLayers: DataLayer[] = []
  ): TagConfig[] {
    if (!this.eventUtils.isIncludeVideo(dataLayers)) {
      return [];
    }
    const trigger = triggers.find((t) => t.name === VIDEO_TRIGGER_NAME);
    if (!trigger?.triggerId) {
      console.error(`Missing trigger (${VIDEO_TRIGGER_NAME}) or triggerId`);
      return [];
    }
    return [
      this.buildEventTag(accountId, containerId, trigger.triggerId),
      this.buildHtmlTag(accountId, containerId, trigger.triggerId)
    ];
  }
}
