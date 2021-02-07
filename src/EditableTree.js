import cn from 'classnames';
import { useEffect, useRef, useState } from 'react';
import './EditableTree.scss';
import { TypedInput } from './TypedInput';

const KEY_PLACEHOLDER = "Key";

/**
 * The simplest version of a node, just rendering a key and scalar value pair.
 */
function ScalarViewNode({ k, value, isRoot, startEditingCallback, deleteCallback }) {
  return <div className={cn('node', { 'is-root': isRoot })}>
    <div className="node-row">
      <div className="node-kv-box">
        <div className="node-key">{k}</div>
        <span className="node-eq">:</span>
        <div className="inline-value" onClick={() => startEditingCallback()}>
          {JSON.stringify(value)}
        </div>
        <button className="icon-button delete-button" onClick={() => deleteCallback()}>
          <i className="material-icons">close</i>
        </button>
      </div>
    </div>
  </div>;
}

/**
 * A node that's currently being edited. Supports editing as a scalar value, or editing visually as
 * a subtree.
 */
function EditorNode({
  initialKey, initialValue, isRoot,
  doneEditingCallback, addSiblingCallback,
}) {
  let [editedKey, setEditedKey] = useState(initialKey || '');
  let [editedScalarValue, setEditedScalarValue] = useState(initialValue || '');
  let [visualChildren, setVisualChildren] = useState(null);
  let keyEditorRef = useRef();

  let finishEditing = ({ cancel, reason } = {}) => {
    if (cancel) {
      doneEditingCallback(initialKey, initialValue, reason);
    }

    if (visualChildren) {
      // gather data
      let newValue = Object.fromEntries(visualChildren
        .filter(({ k }) => !!k)
        .map(({ k, v }) => [k, v]));
      doneEditingCallback(editedKey, newValue, reason);
    } else {
      doneEditingCallback(editedKey, editedScalarValue, reason);
    }
  };

  let resizeKeyEditor = (node, val) =>
    node && (node.style.width = `${(val || KEY_PLACEHOLDER).length * 8}px`);

  let handleKeyDown = ev => {
    ev.key === 'Enter' && finishEditing({ reason: 'enter' });
    ev.key === 'Escape' && finishEditing({ cancel: true, reason: 'cancel' });
  };

  useEffect(() => {
    !initialKey && keyEditorRef.current && keyEditorRef.current.focus();
  }, [keyEditorRef]);

  let blurTimeout = useRef();
  useEffect(() => {
    return () => clearTimeout(blurTimeout.current);
  }, []);

  let addChild = () => setVisualChildren([...(visualChildren || []), {}]);

  return <div className={cn('node', { 'is-root': isRoot })}
    onFocus={() => clearTimeout(blurTimeout.current)}
    onBlur={() => {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = setTimeout(() => finishEditing({ reason: 'blur' }));
    }}>
    <div className="node-row">
      <div className={cn('node-kv-edit-box', { 'is-tree-edit-mode': !!visualChildren })}>
        <input className="key-editor"
          disabled={isRoot}
          placeholder={KEY_PLACEHOLDER}
          ref={node => {
            node && resizeKeyEditor(node, editedKey);
            keyEditorRef.current = node;
          }}
          onKeyDown={handleKeyDown}
          value={editedKey}
          onChange={ev => {
            setEditedKey(ev.target.value);
            resizeKeyEditor(ev.target, ev.target.value);
          }} />
        {!visualChildren && <TypedInput
          className="value-editor"
          initialValue={initialValue}
          autoFocus={!!initialKey}
          onKeyDown={handleKeyDown}
          onChange={value => setEditedScalarValue(value)} />}
        {(visualChildren || !editedScalarValue) &&
          <button className="icon-button add-button" onClick={addChild}>
            <i className="material-icons">add</i>
          </button>}
        <div style={{ width: 0, height: 0 }}
          tabIndex={0}
          onFocus={() => {
            finishEditing({ reason: 'add-sibling' });
            addSiblingCallback();
          }} />
      </div>
    </div>
    {visualChildren && <div className="node-children">
      {visualChildren.map((obj, idx) =>
        <EditorNode key={idx}
          doneEditingCallback={(k, v, reason) => {
            obj.k = k;
            obj.v = v;
            if (reason === 'enter') {
              finishEditing({ reason });
            }
          }}
          addSiblingCallback={addChild} />
      )}
    </div>}
  </div>;
}

/**
 * Renders a sub-tree, allowing new children to be added to the tree, and allowing
 * child items to be edited.
 */
function SubtreeNode({ k, value, isRoot, updateCallback }) {
  let [addingChild, setAddingChild] = useState(false);
  let [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!!value && value._collapsed) {
      setCollapsed(true);
      delete value._collapsed;
      updateCallback(k, value);
    }
  }, []);

  return <div className={cn('node', { 'is-collapsed': collapsed, 'is-root': isRoot })}>
    <div className="node-row">
      {!isRoot && <button className="icon-button collapse-button"
        onClick={() => setCollapsed(!collapsed)}>
        <i className="material-icons">arrow_drop_down</i>
      </button>}
      <div className="node-kv-box">
        <div className="node-key">{k}</div>
        <button
          className="icon-button add-button"
          onClick={() => { setAddingChild(true); setCollapsed(false); }}>
          <i className="material-icons">add</i>
        </button>
        <button
          className="icon-button delete-button"
          onClick={() => updateCallback(k, null)}>
          <i className="material-icons">close</i>
        </button>
      </div>
    </div>
    <div className="node-children">
      {Object.entries(value || {})
        .filter(([k, v]) => !k.startsWith('_') && v !== null)
        .sort(([k1], [k2]) => k1.localeCompare(k2))
        .map(([ck, v]) =>
          <Node
            key={ck}
            k={ck}
            value={v}
            updateCallback={(newChildKey, newChildValue) => {
              let newValue = { ...value };
              delete newValue[ck];
              if (newChildValue !== null) {
                newValue[newChildKey] = newChildValue;
              } else {
                delete newValue[newChildKey];
              }

              updateCallback(k, newValue); // propagate update
            }}
            addSiblingCallback={() => setTimeout(() => setAddingChild(true))}
          />
        )}
      {addingChild && <EditorNode
        doneEditingCallback={(newChildKey, newChildValue) => {
          if (!newChildKey) {
            setAddingChild(false);
            return;
          }

          // propagate update
          updateCallback(k, { ...value, [newChildKey]: newChildValue });
          setAddingChild(false);
        }}
        addSiblingCallback={() => setTimeout(() => setAddingChild(true))}
      />}
    </div>
  </div>;
}

/**
 * A dynamic node that decides how to draw itself based on its value (as a scalar value, or as a
 * subtree), and allows itsel to be edited.
 */
function Node({ k, value, isRoot, updateCallback, addSiblingCallback }) {
  let [editing, setEditing] = useState(false);

  if (editing) {
    return <EditorNode
      initialKey={k}
      initialValue={value}
      isRoot={isRoot}
      doneEditingCallback={(...args) => {
        updateCallback(...args);
        setEditing(false);
      }}
      addSiblingCallback={addSiblingCallback} />;
  }

  let isSubtree = (typeof value === 'object') && value !== null;
  if (isSubtree) {
    return <SubtreeNode
      k={k}
      value={value}
      isRoot={isRoot}
      updateCallback={updateCallback}
      doneEditingCallback={() => setEditing(false)} />;
  }

  return <ScalarViewNode
    k={k}
    value={value}
    isRoot={isRoot}
    startEditingCallback={() => setEditing(true)}
    deleteCallback={() => updateCallback(k, null)} />
}

/**
 * The container for the tree.
 */
export function EditableTree({
  data,
  rootKey = "root",
  onChange,
}) {
  // let [data, setData] = useState(cleanupObject(initialData));

  let update = (_, value) => {
    let newValue = cleanupObject(JSON.parse(JSON.stringify(value)));
    // setData(newValue);
    onChange && onChange(newValue);
  };

  return <div className="tree">
    <Node
      k={rootKey}
      value={data}
      isRoot={true}
      updateCallback={update} />
  </div>;
}

/**
 * Deeply removes nulls and empty objects in an object
 */
function cleanupObject(o) {
  if (o === null || o === undefined || typeof o !== 'object') {
    return o;
  }

  for (let k of Object.keys(o)) {
    o[k] = cleanupObject(o[k]);
    if (o[k] === null || o[k] === undefined) {
      delete o[k];
    }
  }

  return Object.keys(o).filter(k => !k.startsWith('_')).length ? o : null;
}