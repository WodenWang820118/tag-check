import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class Ga4RequestMatcher {
  private readonly logger = new Logger(Ga4RequestMatcher.name);

  isMatchingGa4Request(
    url: string,
    postData: string,
    eventName: string,
    measurementId: string
  ): boolean {
    const parsed = this.tryParseUrl(url);
    if (!parsed) return false;

    if (!this.isGa4Endpoint(parsed)) return false;

    const urlParams = parsed.searchParams;
    if (this.matchQueryParams(urlParams, eventName, measurementId)) return true;

    if (
      postData &&
      this.matchPostBody(postData, urlParams, eventName, measurementId)
    )
      return true;

    return false;
  }

  private tryParseUrl(url: string): URL | null {
    try {
      return new URL(url);
    } catch (err) {
      this.logger.debug(`Failed to parse request URL for GA4 matching: ${err}`);
      return null;
    }
  }

  private isGa4Endpoint(parsed: URL): boolean {
    return (
      parsed.hostname.includes('google-analytics.com') &&
      parsed.pathname.includes('/g/collect')
    );
  }

  private matchQueryParams(
    params: URLSearchParams,
    eventName: string,
    measurementId: string
  ): boolean {
    const enParam = params.get('en');
    const tidParam =
      params.get('tid') || params.get('measurement_id') || params.get('mid');
    return enParam === eventName && tidParam === measurementId;
  }

  private matchPostBody(
    postData: string,
    urlParams: URLSearchParams,
    eventName: string,
    measurementId: string
  ): boolean {
    // Try JSON first
    const json = this.tryParseJson(postData);
    if (json) {
      const bodyEventName =
        (Array.isArray(json.events) && json.events[0]?.name) || '';
      const bodyMeasurementId =
        json.measurement_id || urlParams.get('measurement_id') || '';
      return bodyEventName === eventName && bodyMeasurementId === measurementId;
    }

    // Fallback to form-encoded
    const form = this.tryParseForm(postData);
    if (form) {
      const bodyEn = form.get('en');
      const bodyTid =
        form.get('tid') || form.get('measurement_id') || form.get('mid');
      return bodyEn === eventName && bodyTid === measurementId;
    }

    return false;
  }

  private tryParseJson(postData: string): any | null {
    try {
      if (!postData.trim().startsWith('{')) return null;
      return JSON.parse(postData);
    } catch (err) {
      this.logger.debug(`GA4 body parsing error (json): ${err}`);
      return null;
    }
  }

  private tryParseForm(postData: string): URLSearchParams | null {
    try {
      return new URLSearchParams(postData);
    } catch (err) {
      this.logger.debug(`GA4 body parsing error (form): ${err}`);
      return null;
    }
  }
}
