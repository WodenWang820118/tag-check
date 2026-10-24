import { EventTagConfig, Parameter, Tag, TagTypeEnum, Trigger } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { CONSENT_STATUS_NOT_NEEDED } from '../utils/constant';

/**
 * Builds a GA4 Event tag (`gaawe`) for one custom data layer event. Each
 * event parameter reads its Data Layer Variable (`{{DLV - <path>}}`), and the
 * tag fires on the Custom Event trigger named after the event.
 */
@Injectable({
  providedIn: 'root'
})
export class EventTag {
  constructor(private readonly parameterUtils: ParameterUtils) {}

  /**
   * With "Send Ecommerce data" on, the tag reads the whole `ecommerce`
   * object from the data layer itself, so the parameters taken from it are
   * left out of the parameter table.
   */
  private processEcommerceData(
    tag: Tag,
    isSendEcommerceData: 'true' | 'false'
  ): Parameter[] {
    if (isSendEcommerceData !== 'true') {
      return tag.parameters;
    }

    return tag.parameters.filter(
      (pm) =>
        !(typeof pm.value === 'string' && pm.value.startsWith('ecommerce.'))
    );
  }

  /**
   * @param triggers the trigger names and IDs the tag's firing triggers are
   * looked up in.
   * @param isSendEcommerceData the tag's "Send Ecommerce data" setting.
   */
  createTag(
    googleTagName: string,
    accountId: string,
    containerId: string,
    tag: Tag,
    triggers: Trigger[],
    isSendEcommerceData: 'true' | 'false'
  ): EventTagConfig {
    return {
      name: `GA4 event - ${tag.name}`,
      type: TagTypeEnum.GAAWE,
      accountId,
      containerId,
      parameter: this.buildParameter(googleTagName, tag, isSendEcommerceData),
      firingTriggerId: this.buildTriggerIds(tag, triggers),
      tagFiringOption: 'ONCE_PER_EVENT',
      monitoringMetadata: {
        type: 'MAP'
      },
      consentSettings: {
        consentStatus: CONSENT_STATUS_NOT_NEEDED
      }
    };
  }

  private buildParameter(
    googleTagName: string,
    tag: Tag,
    isSendEcommerceData: 'true' | 'false'
  ) {
    return [
      this.parameterUtils.createBooleanParameter(
        'sendEcommerceData',
        isSendEcommerceData
      ),
      this.parameterUtils.createTemplateParameter('eventName', tag.name),
      // GTM exports a GA4 event tag's parameter table as `eventSettingsTable`;
      // TagCheck's container import reads the same key.
      this.parameterUtils.createListParameter(
        'eventSettingsTable',
        this.processEcommerceData(tag, isSendEcommerceData)
      ),
      this.parameterUtils.createTagReferenceParameter(
        'measurementId',
        googleTagName
      )
    ];
  }

  private buildTriggerIds(tag: Tag, triggers: Trigger[]): string[] {
    return tag.triggers.flatMap((t) =>
      this.parameterUtils.findTriggerIdByEventName(t.name, triggers)
    );
  }
}
