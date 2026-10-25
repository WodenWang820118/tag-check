/** The Chrome Recorder step types the replay handles. */
export enum BrowserAction {
  CLICK = 'click',
  NAVIGATE = 'navigate',
  SETVIEWPORT = 'setViewport',
  CHANGE = 'change',
  HOVER = 'hover',
  KEYDOWN = 'keyDown',
  KEYUP = 'keyUp',
  WAITFORELEMENT = 'waitForElement'
}

/**
 * How a recorded selector starts. The query handler prefixes include their
 * slash, so a CSS selector such as `textarea.q` is not taken for a `text/`
 * selector.
 */
export enum SelectorSymbol {
  CSSID = '#',
  CSSCLASS = '.',
  XPATH = 'xpath/',
  PIERCE = 'pierce/',
  TEXT = 'text/',
  ARIA = 'aria/'
}

/** The selector types ActionUtilsService.getElement resolves. */
export enum SelectorType {
  CLASS = 'css',
  ID = 'id',
  XPATH = 'xpath',
  PIERCE = 'pierce',
  TEXT = 'text',
  ARIA = 'aria'
}
