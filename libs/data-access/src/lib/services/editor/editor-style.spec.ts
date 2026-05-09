import { editorStyles } from './editor-style';

describe('editorStyles', () => {
  it('exposes a fixed scroller height of 75vh', () => {
    expect(editorStyles['.cm-scroller']).toEqual({
      overflow: 'auto',
      height: '75vh'
    });
  });

  it('configures a justified white-on-black content block', () => {
    expect(editorStyles['.cm-content']).toEqual({
      textAlign: 'justify',
      background: 'white',
      color: 'black',
      padding: '1em',
      borderRadius: '3px',
      overflow: 'auto',
      width: '100%'
    });
  });
});
