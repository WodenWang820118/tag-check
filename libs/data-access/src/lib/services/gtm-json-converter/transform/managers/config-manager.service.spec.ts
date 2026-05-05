import { TestBed } from '@angular/core/testing';
import { ConfigManager } from './config-manager.service';
import { UtilsService } from '../../utils/utils.service';
import type { TagConfig, TriggerConfig, VariableConfig } from '@utils';

describe('ConfigManager', () => {
  let service: ConfigManager;
  let utilsService: UtilsService;

  const mockAccountId = '123456';
  const mockContainerId = '789012';
  const mockContainerName = 'Test Container';
  const mockGtmId = 'GTM-XXXXXX';

  const mockVariable: VariableConfig = {
    name: 'DLV - page_location',
    type: 'v',
    accountId: mockAccountId,
    containerId: mockContainerId,
    parameter: [
      { type: 'INTEGER', key: 'dataLayerVersion', value: '2' },
      { type: 'BOOLEAN', key: 'setDefaultValue', value: 'false' },
      { type: 'TEMPLATE', key: 'name', value: 'page_location' }
    ]
  };

  const mockBuiltInVariable: VariableConfig = {
    name: 'Page URL',
    type: 'PAGE_URL',
    accountId: mockAccountId,
    containerId: mockContainerId
  };

  const mockTrigger: TriggerConfig = {
    name: 'event equals page_view',
    type: 'CUSTOM_EVENT',
    accountId: mockAccountId,
    containerId: mockContainerId,
    triggerId: '1',
    customEventFilter: [
      {
        type: 'EQUALS',
        parameter: [
          { type: 'TEMPLATE', key: 'arg0', value: '{{_event}}' },
          { type: 'TEMPLATE', key: 'arg1', value: 'page_view' }
        ]
      }
    ]
  };

  const mockTag: TagConfig = {
    name: 'Google Tag',
    type: 'googtag',
    accountId: mockAccountId,
    containerId: mockContainerId,
    tagId: '1',
    parameter: [
      {
        type: 'TEMPLATE',
        key: 'tagId',
        value: '{{CONST - Measurement ID}}'
      }
    ],
    firingTriggerId: ['2147479553'],
    tagFiringOption: 'ONCE_PER_EVENT',
    monitoringMetadata: { type: 'MAP' },
    consentSettings: { consentStatus: 'NOT_NEEDED' }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfigManager, UtilsService]
    });
    service = TestBed.inject(ConfigManager);
    utilsService = TestBed.inject(UtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getGTMFinalConfiguration', () => {
    it('should produce a valid GTMConfiguration with exportFormatVersion 2', () => {
      const result = service.getGTMFinalConfiguration({
        accountId: mockAccountId,
        containerId: mockContainerId,
        variables: [mockVariable],
        builtInVariables: [mockBuiltInVariable],
        triggers: [mockTrigger],
        tags: [mockTag],
        containerName: mockContainerName,
        gtmId: mockGtmId
      });

      expect(result.exportFormatVersion).toBe(2);
      expect(result.exportTime).toBeTruthy();
      expect(typeof result.exportTime).toBe('string');
    });

    it('should wire accountId and containerId into all nested paths', () => {
      const result = service.getGTMFinalConfiguration({
        accountId: mockAccountId,
        containerId: mockContainerId,
        variables: [],
        builtInVariables: [],
        triggers: [],
        tags: [],
        containerName: mockContainerName,
        gtmId: mockGtmId
      });

      const cv = result.containerVersion;
      expect(cv.path).toBe(
        `accounts/${mockAccountId}/containers/${mockContainerId}/versions/0`
      );
      expect(cv.accountId).toBe(mockAccountId);
      expect(cv.containerId).toBe(mockContainerId);
      expect(cv.containerVersionId).toBe('0');
      expect(cv.container.accountId).toBe(mockAccountId);
      expect(cv.container.containerId).toBe(mockContainerId);
    });

    it('should populate the container with the provided name and gtmId', () => {
      const result = service.getGTMFinalConfiguration({
        accountId: mockAccountId,
        containerId: mockContainerId,
        variables: [],
        builtInVariables: [],
        triggers: [],
        tags: [],
        containerName: mockContainerName,
        gtmId: mockGtmId
      });

      expect(result.containerVersion.container.name).toBe(mockContainerName);
      expect(result.containerVersion.container.publicId).toBe(mockGtmId);
    });

    it('should include variables, builtInVariables, triggers, and tags arrays', () => {
      const result = service.getGTMFinalConfiguration({
        accountId: mockAccountId,
        containerId: mockContainerId,
        variables: [mockVariable],
        builtInVariables: [mockBuiltInVariable],
        triggers: [mockTrigger],
        tags: [mockTag],
        containerName: mockContainerName,
        gtmId: mockGtmId
      });

      expect(result.containerVersion.variable).toEqual([mockVariable]);
      expect(result.containerVersion.builtInVariable).toEqual([
        mockBuiltInVariable
      ]);
      expect(result.containerVersion.trigger).toEqual([mockTrigger]);
      expect(result.containerVersion.tag).toEqual([mockTag]);
    });

    it('should handle empty arrays gracefully', () => {
      const result = service.getGTMFinalConfiguration({
        accountId: mockAccountId,
        containerId: mockContainerId,
        variables: [],
        builtInVariables: [],
        triggers: [],
        tags: [],
        containerName: mockContainerName,
        gtmId: mockGtmId
      });

      expect(result.containerVersion.variable).toEqual([]);
      expect(result.containerVersion.builtInVariable).toEqual([]);
      expect(result.containerVersion.trigger).toEqual([]);
      expect(result.containerVersion.tag).toEqual([]);
    });

    it('should include correct feature flags in the container', () => {
      const result = service.getGTMFinalConfiguration({
        accountId: mockAccountId,
        containerId: mockContainerId,
        variables: [],
        builtInVariables: [],
        triggers: [],
        tags: [],
        containerName: mockContainerName,
        gtmId: mockGtmId
      });

      const features = result.containerVersion.container.features;
      expect(features.supportUserPermissions).toBe(true);
      expect(features.supportEnvironments).toBe(true);
      expect(features.supportWorkspaces).toBe(true);
      expect(features.supportBuiltInVariables).toBe(true);
      expect(features.supportTags).toBe(true);
      expect(features.supportTriggers).toBe(true);
      expect(features.supportVariables).toBe(true);
      expect(features.supportVersions).toBe(true);
      expect(features.supportFolders).toBe(true);
      expect(features.supportTemplates).toBe(true);
      expect(features.supportZones).toBe(true);
    });

    it('should set correct tagManagerUrl in both container and version', () => {
      const result = service.getGTMFinalConfiguration({
        accountId: mockAccountId,
        containerId: mockContainerId,
        variables: [],
        builtInVariables: [],
        triggers: [],
        tags: [],
        containerName: mockContainerName,
        gtmId: mockGtmId
      });

      const { container, tagManagerUrl } = result.containerVersion;
      expect(container.tagManagerUrl).toContain(
        `accounts/${mockAccountId}/containers/${mockContainerId}`
      );
      expect(tagManagerUrl).toContain(
        `accounts/${mockAccountId}/containers/${mockContainerId}/versions/0`
      );
    });

    it('should set usageContext to WEB', () => {
      const result = service.getGTMFinalConfiguration({
        accountId: mockAccountId,
        containerId: mockContainerId,
        variables: [],
        builtInVariables: [],
        triggers: [],
        tags: [],
        containerName: mockContainerName,
        gtmId: mockGtmId
      });

      expect(result.containerVersion.container.usageContext).toEqual(['WEB']);
    });

    it('should set tagIds on the container', () => {
      const result = service.getGTMFinalConfiguration({
        accountId: mockAccountId,
        containerId: mockContainerId,
        variables: [],
        builtInVariables: [],
        triggers: [],
        tags: [],
        containerName: mockContainerName,
        gtmId: mockGtmId
      });

      expect(result.containerVersion.container.tagIds).toEqual([mockGtmId]);
    });
  });
});
