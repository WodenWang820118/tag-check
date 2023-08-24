import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilitiesService {
  async waitForSelectors(selectors, frame, options) {
    for (const selector of selectors) {
      try {
        return await this.waitForSelector(selector, frame, options);
      } catch (err) {
        console.error(err);
      }
    }
    throw new Error(
      'Could not find element for selectors: ' + JSON.stringify(selectors),
    );
  }

  async scrollIntoViewIfNeeded(selectors, frame, timeout) {
    const element = await this.waitForSelectors(selectors, frame, {
      visible: false,
      timeout,
    });
    if (!element) {
      throw new Error('The element could not be found.');
    }
    await this.waitForConnected(element, timeout);
    const isInViewport = await element.isIntersectingViewport({ threshold: 0 });
    if (isInViewport) {
      return;
    }
    await element.evaluate(element => {
      element.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: 'auto',
      });
    });
    await this.waitForInViewport(element, timeout);
  }

  async waitForConnected(element, timeout) {
    await this.waitForFunction(async () => {
      return await element.getProperty('isConnected');
    }, timeout);
  }

  async waitForInViewport(element, timeout) {
    await this.waitForFunction(async () => {
      return await element.isIntersectingViewport({ threshold: 0 });
    }, timeout);
  }

  async waitForSelector(selector, frame, options) {
    if (!Array.isArray(selector)) {
      selector = [selector];
    }
    if (!selector.length) {
      throw new Error('Empty selector provided to waitForSelector');
    }
    let element = null;
    for (let i = 0; i < selector.length; i++) {
      const part = selector[i];
      if (element) {
        element = await element.waitForSelector(part, options);
      } else {
        element = await frame.waitForSelector(part, options);
      }
      if (!element) {
        throw new Error('Could not find element: ' + selector.join('>>'));
      }
      if (i < selector.length - 1) {
        element = (
          await element.evaluateHandle(el =>
            el.shadowRoot ? el.shadowRoot : el,
          )
        ).asElement();
      }
    }
    if (!element) {
      throw new Error('Could not find element: ' + selector.join('|'));
    }
    return element;
  }

  async waitForElement(step, frame, timeout) {
    const {
      count = 1,
      operator = '>=',
      visible = true,
      properties,
      attributes,
    } = step;
    const compFn = {
      '==': (a, b) => a === b,
      '>=': (a, b) => a >= b,
      '<=': (a, b) => a <= b,
    }[operator];
    await this.waitForFunction(async () => {
      const elements = await this.querySelectorsAll(step.selectors, frame);
      let result = compFn(elements.length, count);
      const elementsHandle = await frame.evaluateHandle((...elements) => {
        return elements;
      }, ...elements);
      await Promise.all(elements.map(element => element.dispose()));
      if (result && (properties || attributes)) {
        result = await elementsHandle.evaluate(
          (elements, properties, attributes) => {
            for (const element of elements) {
              if (attributes) {
                for (const [name, value] of Object.entries(attributes)) {
                  if (element.getAttribute(name) !== value) {
                    return false;
                  }
                }
              }
              if (properties) {
                if (!isDeepMatch(properties, element)) {
                  return false;
                }
              }
            }
            return true;

            function isDeepMatch(a, b) {
              if (a === b) {
                return true;
              }
              if ((a && !b) || (!a && b)) {
                return false;
              }
              if (!(a instanceof Object) || !(b instanceof Object)) {
                return false;
              }
              for (const [key, value] of Object.entries(a)) {
                if (!isDeepMatch(value, b[key])) {
                  return false;
                }
              }
              return true;
            }
          },
          properties,
          attributes,
        );
      }
      await elementsHandle.dispose();
      return result === visible;
    }, timeout);
  }

  async querySelectorsAll(selectors, frame) {
    for (const selector of selectors) {
      const result = await this.querySelectorAll(selector, frame);
      if (result.length) {
        return result;
      }
    }
    return [];
  }

  async querySelectorAll(selector, frame) {
    if (!Array.isArray(selector)) {
      selector = [selector];
    }
    if (!selector.length) {
      throw new Error('Empty selector provided to querySelectorAll');
    }
    let elements = [];
    for (let i = 0; i < selector.length; i++) {
      const part = selector[i];
      if (i === 0) {
        elements = await frame.$$(part);
      } else {
        const tmpElements = elements;
        elements = [];
        for (const el of tmpElements) {
          elements.push(...(await el.$$(part)));
        }
      }
      if (elements.length === 0) {
        return [];
      }
      if (i < selector.length - 1) {
        const tmpElements = [];
        for (const el of elements) {
          const newEl = (
            await el.evaluateHandle(el => (el.shadowRoot ? el.shadowRoot : el))
          ).asElement();
          if (newEl) {
            tmpElements.push(newEl);
          }
        }
        elements = tmpElements;
      }
    }
    return elements;
  }

  async waitForFunction(fn, timeout) {
    let isActive = true;
    const timeoutId = setTimeout(() => {
      isActive = false;
    }, timeout);
    while (isActive) {
      const result = await fn();
      if (result) {
        clearTimeout(timeoutId);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Timed out');
  }

  async changeSelectElement(element, value) {
    await element.select(value);
    await element.evaluateHandle(e => {
      e.blur();
      e.focus();
    });
  }

  async changeElementValue(element, value) {
    await element.focus();
    await element.evaluate((input, value) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  }

  async typeIntoElement(element, value) {
    const textToType = await element.evaluate((input, newValue) => {
      if (
        newValue.length <= input.value.length ||
        !newValue.startsWith(input.value)
      ) {
        input.value = '';
        return newValue;
      }
      const originalValue = input.value;
      input.value = '';
      input.value = originalValue;
      return newValue.substring(originalValue.length);
    }, value);
    await element.type(textToType);
  }
}
