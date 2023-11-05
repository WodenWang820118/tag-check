import {
  AriaChangeStrategy,
  CSSChangeStrategy,
  ChangeStrategy,
  PiercingChangeStrategy,
  XpathChangeStrategy,
} from './change-strategy';

import {
  AriaHoverStrategy,
  CSSHoverStrategy,
  HoverStrategy,
  PierceHoverStrategy,
  TextHoverStrategy,
  XPathHoverStrategy,
} from './hover-strategy';
import { SelectorType } from '../action-utilities';
import { Injectable } from '@nestjs/common';
import { CSSClickStrategy } from './click-strategies/css-click-strategy';
import { ClickStrategy } from './click-strategies/utils';
import { XPathClickStrategy } from './click-strategies/xpath-click-strategy';
import { PierceClickStrategy } from './click-strategies/pierce-click-strategy';
import { TextClickStrategy } from './click-strategies/text-click-strategy';
import { AriaClickStrategy } from './click-strategies/aria-click-strategy';

@Injectable()
export class StrategyManager {
  clickStrategies: { [key: string]: ClickStrategy };
  changeStrategies: { [key: string]: ChangeStrategy };
  hoverStrategies: { [key: string]: HoverStrategy };

  constructor() {
    this.clickStrategies = this.initializeClickStrategies();
    this.changeStrategies = this.initializeChangeStrategies();
    this.hoverStrategies = this.initializeHoverStrategies();
  }

  private initializeClickStrategies(): { [key: string]: ClickStrategy } {
    return {
      [SelectorType.CSSID]: new CSSClickStrategy(),
      [SelectorType.CSSCLASS]: new CSSClickStrategy(),
      [SelectorType.XPATH]: new XPathClickStrategy(),
      [SelectorType.PIERCE]: new PierceClickStrategy(),
      [SelectorType.TEXT]: new TextClickStrategy(),
      [SelectorType.ARIA]: new AriaClickStrategy(),
    };
  }

  private initializeChangeStrategies(): { [key: string]: ChangeStrategy } {
    return {
      [SelectorType.CSSID]: new CSSChangeStrategy(),
      [SelectorType.CSSCLASS]: new CSSChangeStrategy(),
      [SelectorType.XPATH]: new XpathChangeStrategy(),
      [SelectorType.PIERCE]: new PiercingChangeStrategy(),
      [SelectorType.ARIA]: new AriaChangeStrategy(),
    };
  }

  private initializeHoverStrategies(): { [key: string]: HoverStrategy } {
    return {
      [SelectorType.CSSID]: new CSSHoverStrategy(),
      [SelectorType.CSSCLASS]: new CSSHoverStrategy(),
      [SelectorType.XPATH]: new XPathHoverStrategy(),
      [SelectorType.PIERCE]: new PierceHoverStrategy(),
      [SelectorType.TEXT]: new TextHoverStrategy(),
      [SelectorType.ARIA]: new AriaHoverStrategy(),
    };
  }
}
