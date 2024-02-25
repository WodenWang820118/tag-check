import { basicSetup } from 'codemirror';
import { Compartment, EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { json } from '@codemirror/lang-json';

import {
  indentWithTab,
  history,
  defaultKeymap,
  historyKeymap,
} from '@codemirror/commands';

const commonExtensions = [
  basicSetup,
  keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
  history(),
  new Compartment().of(EditorState.tabSize.of(2)),
];

export const jsonLightEditorExtensions = [...commonExtensions, json()];
