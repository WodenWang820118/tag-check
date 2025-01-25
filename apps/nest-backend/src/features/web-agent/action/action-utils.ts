export enum BrowserAction {
  CLICK = 'click',
  NAVIGATE = 'navigate',
  SETVIEWPORT = 'setViewport',
  CHANGE = 'change',
  HOVER = 'hover',
  KEYDOWN = 'keyDown',
  KEYUP = 'keyUp',
  WAITFORELEMENT = 'waitForElement',
}

export enum SelectorSymbol {
  CSSID = '#',
  CSSCLASS = '.',
  XPATH = 'xpath',
  PIERCE = 'pierce',
  TEXT = 'text',
  ARIA = 'aria',
}

export enum SelectorType {
  CLASS = 'css',
  ID = 'id',
  XPATH = 'xpath',
  PIERCE = 'pierce',
  TEXT = 'text',
  ARIA = 'aria',
}
