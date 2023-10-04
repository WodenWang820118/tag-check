import {
  AriaChangeStrategy,
  CSSChangeStrategy,
  ChangeStrategy,
  PiercingChangeStrategy,
  XpathChangeStrategy,
} from './change-strategy';
import {
  CSSClickStrategy,
  ClickStrategy,
  PierceClickStrategy,
  TextClickStrategy,
  XPathClickStrategy,
} from './click-strategy';
import {
  AriaHoverStrategy,
  CSSHoverStrategy,
  HoverStrategy,
  PierceHoverStrategy,
  TextHoverStrategy,
  XPathHoverStrategy,
} from './hover-strategy';
import { SelectorType } from '../action-utilities';

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
      [SelectorType.CSS]: new CSSClickStrategy(),
      [SelectorType.XPATH]: new XPathClickStrategy(),
      [SelectorType.PIERCE]: new PierceClickStrategy(),
      [SelectorType.TEXT]: new TextClickStrategy(),
    };
  }

  private initializeChangeStrategies(): { [key: string]: ChangeStrategy } {
    return {
      [SelectorType.CSS]: new CSSChangeStrategy(),
      [SelectorType.XPATH]: new XpathChangeStrategy(),
      [SelectorType.PIERCE]: new PiercingChangeStrategy(),
      [SelectorType.ARIA]: new AriaChangeStrategy(),
    };
  }

  private initializeHoverStrategies(): { [key: string]: HoverStrategy } {
    return {
      [SelectorType.CSS]: new CSSHoverStrategy(),
      [SelectorType.XPATH]: new XPathHoverStrategy(),
      [SelectorType.PIERCE]: new PierceHoverStrategy(),
      [SelectorType.TEXT]: new TextHoverStrategy(),
      [SelectorType.ARIA]: new AriaHoverStrategy(),
    };
  }
}
