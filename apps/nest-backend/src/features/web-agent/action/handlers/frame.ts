import type { Frame, Page } from 'puppeteer';

/**
 * The page or one of its frames. Selector queries and the DOM click, hover
 * and type run here. The mouse, the keyboard and the browser context stay on
 * the page: a frame has no mouse, and an element handle's box is already in
 * the main viewport.
 */
export type QueryRoot = Page | Frame;

/**
 * The frame whose document `root` queries. A page stands for its main frame,
 * which is the document `page.$` and `page.click` use. Splitting the page off
 * here keeps the later calls on `Frame`: `Page` and `Frame` both declare
 * those methods, and a union of the two generic signatures does not typecheck.
 */
export function targetFrame(root: QueryRoot): Frame {
  if ('mainFrame' in root) {
    return root.mainFrame();
  }
  return root;
}

/** How often a missing child frame is looked for again. */
const FRAME_POLL_MS = 50;

/**
 * The frame a step runs in.
 *
 * Chrome Recorder's `frame` is a path of child-frame indices from the main
 * frame. An omitted or empty path is the main frame. Frames are often created
 * after the document, so a missing index is polled until `timeout` ms and
 * then rejected with an error that names the path.
 */
export async function resolveStepFrame(
  page: Page,
  framePath: number[] | undefined,
  timeout: number
): Promise<Frame> {
  if (!framePath || framePath.length === 0) {
    return page.mainFrame();
  }
  let current = page.mainFrame();
  for (let depth = 0; depth < framePath.length; depth++) {
    const index = framePath[depth];
    const child = await childFrameAt(current, index, timeout);
    if (!child) {
      const where =
        depth === 0
          ? 'the main frame'
          : `frame [${framePath.slice(0, depth).join(', ')}]`;
      throw new Error(
        `Frame [${framePath.join(', ')}] did not appear within ${timeout} ms ` +
          `(no child frame at index ${index} of ${where})`
      );
    }
    current = child;
  }
  return current;
}

async function childFrameAt(
  frame: Frame,
  index: number,
  timeout: number
): Promise<Frame | undefined> {
  const deadline = Date.now() + Math.max(0, timeout);
  for (;;) {
    const child = frame.childFrames()[index];
    if (child) {
      return child;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      return undefined;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, Math.min(FRAME_POLL_MS, remaining));
    });
  }
}
