// the width of the editor is set to 25vw to dynamically adjust to the screen size
// the editor width will flex-grow to fill the remaining space once met the breakpoint
export const editorStyles = {
  '.cm-scroller': {
    overflow: 'auto',
    height: '60vh',
  },
  '.cm-content': {
    textAlign: 'justify',
    background: 'white',
    color: 'black',
    padding: '1em',
    borderRadius: '3px',
    overflow: 'auto',
    width: '25vw',
  },
};
