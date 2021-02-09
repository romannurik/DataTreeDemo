import { useEffect, useRef, useState } from 'react';
import './App.scss';
import { EditableTree } from './EditableTree';
import { EXAMPLE1, EXAMPLE2 } from './fake-data';

const DENSITY = [
  'default',
  'comfortable',
  'compact',
];

function App() {
  let [data, setData] = useState(EXAMPLE1);
  let [dark, setDark] = useState(false);
  let [density, setDensity] = useState(DENSITY[0]);
  let treeRef = useRef();

  let collapse = (c) => {
    treeRef.current.setCollapsed && treeRef.current.setCollapsed(c);
  };

  let setNextDensity = () => {
    setDensity(DENSITY[(DENSITY.indexOf(density) + 1) % DENSITY.length]);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', dark);
  }, [dark]);

  return <>
    <div className="container">
      <div className="controls">
        <button onClick={() => setData(EXAMPLE1)}>ex1</button>
        <button onClick={() => setData(EXAMPLE2)}>ex2</button>
        <button onClick={() => collapse(false)}>
          <i className="material-icons">unfold_more</i>
        </button>
        <button onClick={() => collapse(true)}>
          <i className="material-icons">unfold_less</i>
        </button>
        <button onClick={() => setNextDensity()}>
          <i className="material-icons">zoom_out</i>
        </button>
        <button onClick={() => setDark(!dark)}>
          <i className="material-icons">
            {dark ? 'brightness_7' : 'mode_night'}
          </i>
        </button>
      </div>
      <div className="pane">
        <EditableTree
          ref={treeRef}
          className={`density-${density}`}
          rootKey="foo.db"
          data={data}
          onChange={val => setData(val)} />
      </div>
      <pre className="pane">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  </>;
}

export default App;
