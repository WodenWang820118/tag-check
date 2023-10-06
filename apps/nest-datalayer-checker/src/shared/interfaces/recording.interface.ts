export interface Operation {
  title: string;
  steps: (StepSetViewport | StepNavigate | StepInteraction)[];
}

// export interface Step {
//   type: StepType;
//   target?: string;
//   selectors?: SelectorsType[];
//   width?: number;
//   height?: number;
//   deviceScaleFactor?: number;
//   isMobile?: boolean;
//   hasTouch?: boolean;
//   isLandscape?: boolean;
//   url?: string;
//   assertedEvents?: AssertedEvent[];
//   offsetX?: number;
//   offsetY?: number;
// }

type StepType = 'setViewport' | 'navigate' | 'hover' | 'click' | 'change';

export type SelectorsType = string | string[] | (string | string[])[];

interface AssertedEvent {
  type: string;
  url?: string;
  title?: string;
}

export interface Step {
  type: string;
  [key: string]: any; // Keeping it extensible
}

interface StepSetViewport extends Step {
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
  isLandscape: boolean;
}

interface StepNavigate extends Step {
  url: string;
  assertedEvents?: AssertedEvent[];
}

interface StepInteraction extends Step {
  target: string;
  selectors: string[][];
  offsetX?: number;
  offsetY?: number;
  button?: 'primary' | 'secondary'; // Added possible button types
  value?: string; // For 'change' type
  assertedEvents?: AssertedEvent[];
}
