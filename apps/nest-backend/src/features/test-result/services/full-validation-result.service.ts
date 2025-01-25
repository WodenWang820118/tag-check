/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { OutputValidationResult } from '@utils';
import { EntityManager } from 'typeorm';

@Injectable()
export class FullValidationResultService {
  constructor(@InjectEntityManager() private manager: EntityManager) {}

  async getReports(projectSlug: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const results = await this.manager.query(
        `
        SELECT
          t1.eventId,
          t1.eventName,
          t1.testName,
          t1.projectSlug,
          t1.passed,
          t1.requestPassed,
          t1.message,
          t1.createdAt,
          json(t2.dataLayer) as dataLayer,
          json(t2.dataLayerSpec) as dataLayerSpec,
          t1.rawRequest,
          t1.destinationUrl
        FROM test_result t1
        LEFT JOIN test_data_layer t2 ON t1.eventId = t2.eventId
        LEFT JOIN image_result t3 ON t1.eventId = t3.eventId
        WHERE t1.projectSlug = ?
        `,
        [projectSlug]
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!results || results.length === 0) {
        return [];
      }

      return results as OutputValidationResult[];
    } catch (error) {
      throw new Error(`Failed to fetch joined data: ${error}`);
    }
  }

  async getReportDetailsData(
    eventIds: string[]
  ): Promise<OutputValidationResult[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const results = await this.manager.query(
        `
        SELECT
          t1.eventId,
          t1.eventName,
          t1.testName,
          t1.projectSlug,
          t1.passed,
          t1.requestPassed,
          t1.message,
          t1.createdAt,
          json(t2.dataLayer) as dataLayer,
          json(t2.dataLayerSpec) as dataLayerSpec,
          t1.rawRequest,
          t1.destinationUrl,
          t3.imageData
        FROM test_result t1
        LEFT JOIN test_data_layer t2 ON t1.eventId = t2.eventId
        LEFT JOIN image_result t3 ON t1.eventId = t3.eventId
        WHERE t1.eventId IN (?)
        `,
        eventIds
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!results || results.length === 0) {
        return [];
      }

      return results as OutputValidationResult[];
    } catch (error) {
      throw new Error(`Failed to fetch joined data: ${error}`);
    }
  }

  async getSingleReportDetailsData(
    eventId: string
  ): Promise<OutputValidationResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const results = await this.manager.query(
        `
        SELECT
          t1.eventId,
          t1.eventName,
          t1.testName,
          t1.projectSlug,
          t1.passed,
          t1.requestPassed,
          t1.message,
          t1.createdAt,
          t2.dataLayer,
          t2.dataLayerSpec,
          t1.rawRequest,
          t1.destinationUrl,
          t3.imageData
        FROM test_result t1
        LEFT JOIN test_data_layer t2 ON t1.eventId = t2.eventId
        LEFT JOIN image_result t3 ON t1.eventId = t3.eventId
        WHERE t1.eventId = ?
        `,
        [eventId]
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return results[0] as OutputValidationResult;
    } catch (error) {
      throw new Error(`Failed to fetch joined data: ${error}`);
    }
  }
}
