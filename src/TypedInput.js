import cn from 'classnames';
import { useEffect, useRef, useState } from "react";
import { Menu, MenuItem } from "./Menu";
import './TypedInput.scss';

const DATA_TYPES = [
  {
    type: 'string',
    title: 'String',
    isOfType: v => typeof v === 'string',
    validate: s => true,
    deserialize: s => s,
    autoDetectOrder: 1000,
  },
  {
    type: 'number',
    title: 'Number',
    isOfType: v => typeof v === 'number',
    validate: s => !isNaN(s),
    deserialize: s => Number(s),
    autoDetectOrder: 900,
  },
  {
    type: 'boolean',
    title: 'Boolean',
    isOfType: v => typeof v === 'boolean',
    validate: s => {
      s = s.replace(/^\s+|\s+$/g, '').toLowerCase();
      return s === 'true' || s === 'false';
    },
    deserialize: s => !!(s === 'true'),
    autoDetectOrder: 10,
  },
  {
    type: 'object',
    title: 'Object',
    isOfType: v => typeof v === 'object',
    validate: s => { try { JSON.parse(s); return true; } catch { } return false; },
    deserialize: s => JSON.parse(s),
    autoDetectOrder: 990,
  },
];

const DATA_TYPES_DETECT_ORDERED = DATA_TYPES.sort((x, y) => x.autoDetectOrder - y.autoDetectOrder);

function detectDataType(s) {
  if (s.length <= 0) {
    return null;
  }

  for (let { type, validate } of DATA_TYPES_DETECT_ORDERED) {
    if (validate(s)) {
      return type;
    }
  }
}

function dataTypeOf(v) {
  for (let { type, isOfType } of DATA_TYPES_DETECT_ORDERED) {
    if (isOfType(v)) {
      return type;
    }
  }

  return 'auto';
}

export function TypedInput({ className, initialValue, autoFocus, onChange, onKeyDown }) {
  let [stringValue, setStringValue] = useState(String(initialValue === undefined ? '' : initialValue));
  let [dataType, setDataType] = useState((initialValue === undefined || initialValue === null)
    ? 'auto'
    : dataTypeOf(initialValue));
  let [detectedDataType, setDetectedDataType] = useState(null);
  let [menuOpen, setMenuOpen] = useState(false);
  let typeButtonRef = useRef();
  let inputRef = useRef();

  let isValid = () => dataType === 'auto'
    || DATA_TYPES.find(({ type }) => type === dataType).validate(stringValue);

  let deserializeOrRevert = s => {
    let type = (dataType === 'auto') ? detectDataType(s) : dataType;
    if (!type) {
      return initialValue;
    }

    let dt = DATA_TYPES.find(dt => dt.type === type);
    return dt.validate(s) ? dt.deserialize(s) : initialValue;
  };

  let changeType = type => {
    setDataType(type);
    setMenuOpen(false);
    setDetectedDataType(detectDataType(stringValue));
    inputRef.current && inputRef.current.focus();
  };

  useEffect(() => {
    onChange(deserializeOrRevert(stringValue));
  }, [dataType]);

  let onValueChange = ev => {
    let value = String(ev.target.value);
    setDetectedDataType(detectDataType(value));
    setStringValue(value);
    onChange(deserializeOrRevert(value));
    inputRef.current && resizeValueEditor(inputRef.current, value);
  };

  let resizeValueEditor = (node, val) => {
    node && (node.style.width = `${Math.max(50, measureText(node, val))}px`);
  }

  useEffect(() => {
    if (dataType === 'auto' && detectedDataType !== null) {
      typeButtonRef.current.animate([
        { backgroundColor: 'rgba(26, 115, 232, .3)' },
        { backgroundColor: 'transparent' }
      ], { duration: 200 });
    }
  }, [dataType, detectedDataType]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef, autoFocus]);

  let shownTypeIcon = (dataType === 'auto')
    ? detectedDataType || 'dropdown'
    : dataType;

  return (
    <div className={cn(className, 'typed-field', { 'is-invalid': !isValid() })}>
      <input className="typed-field__value"
        ref={node => {
          node && resizeValueEditor(node, stringValue);
          inputRef.current = node;
        }}
        placeholder="Value"
        onInput={onValueChange}
        onKeyDown={onKeyDown}
        value={stringValue} />

      <div style={{ position: 'relative' }}>
        <button className="typed-field__type"
          ref={typeButtonRef}
          onClick={() => setMenuOpen(true)}>
          <div className="typed-field__type-icon"
            dangerouslySetInnerHTML={iconHtml(shownTypeIcon)}></div>
        </button>

        <Menu open={menuOpen} onClose={() => {
          setMenuOpen(false);
          inputRef.current && inputRef.current.focus();
        }}>
          <MenuItem type="auto" title="Auto" selected={dataType === 'auto'}
            iconSvg={iconHtml('auto')}
            onClick={() => changeType('auto')} />
          {DATA_TYPES.map(({ type, title }) =>
            <MenuItem key={type} type={type} title={title} selected={dataType === type}
              iconSvg={iconHtml(type)}
              onClick={() => changeType(type)} />
          )}
        </Menu>
      </div>
    </div>);
}

const ICONS = {
  'dropdown': '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>',
  'auto': '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13 10.268l3.696-2.134 1 1.732L14 12l3.696 2.134-1 1.732L13 13.732V18h-2v-4.268l-3.696 2.134-1-1.732L10 12 6.304 9.866l1-1.732L11 10.268V6h2z" fill-rule="evenodd"/></svg>',
  'string': '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 7c.553 0 1.025.195 1.415.585.39.39.585.862.585 1.415v8H6v-2H4v2H2V9c0-.553.195-1.025.585-1.415C2.975 7.195 3.447 7 4 7h2zM4 9v4h2V9H4zm11 1.5c0 .413-.147.767-.44 1.06-.293.293-.647.44-1.06.44.413 0 .767.147 1.06.44.293.293.44.647.44 1.06V15c0 .553-.195 1.025-.585 1.415-.39.39-.862.585-1.415.585H9V7h4c.553 0 1.025.195 1.415.585.39.39.585.862.585 1.415v1.5zM11 13v2h2v-2h-2zm0-4v2h2V9h-2zm5 6V9c0-.553.195-1.025.585-1.415.39-.39.862-.585 1.415-.585h2c.553 0 1.025.195 1.415.585.39.39.585.862.585 1.415v1.5h-2V9h-2v6h2v-1.5h2V15c0 .547-.197 1.017-.59 1.41-.393.393-.863.59-1.41.59h-2a1.924 1.924 0 0 1-1.41-.59A1.924 1.924 0 0 1 16 15z" fill-rule="evenodd"/></svg>',
  'number': '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 9V7h4v10H5V9H3zm5-2h4c.547 0 1.017.197 1.41.59.393.393.59.863.59 1.41v2c0 .547-.197 1.017-.59 1.41-.393.393-.863.59-1.41.59h-2v2h4v2H8v-4c0-.553.195-1.025.585-1.415.39-.39.862-.585 1.415-.585h2V9H8V7zm7 0h4c.547 0 1.017.197 1.41.59.393.393.59.863.59 1.41v1.5c0 .413-.147.767-.44 1.06-.293.293-.647.44-1.06.44.413 0 .767.147 1.06.44.293.293.44.647.44 1.06V15c0 .547-.197 1.017-.59 1.41-.393.393-.863.59-1.41.59h-4v-2h4v-2h-2v-2h2V9h-4V7z" fill-rule="evenodd"/></svg>',
  'object': '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 8v1.68c0 .4-.075.795-.225 1.185a3.62 3.62 0 01-.625 1.055c.567.58.85 1.273.85 2.08v2c0 .273.098.508.295.705A.962.962 0 009 17h1v2H9a2.89 2.89 0 01-2.12-.88A2.89 2.89 0 016 16v-2a.962.962 0 00-.295-.705A.962.962 0 005 13H4v-2h1c.26 0 .492-.147.695-.44.203-.293.305-.587.305-.88V8c0-.827.293-1.533.88-2.12A2.89 2.89 0 019 5h1v2H9a.962.962 0 00-.705.295A.962.962 0 008 8zm11 3h1v2h-1a.962.962 0 00-.705.295A.962.962 0 0018 14v2a2.89 2.89 0 01-.88 2.12A2.89 2.89 0 0115 19h-1v-2h1a.962.962 0 00.705-.295A.962.962 0 0016 16v-2c0-.807.283-1.5.85-2.08a3.62 3.62 0 01-.625-1.055A3.277 3.277 0 0116 9.68V8a1.008 1.008 0 00-1-1h-1V5h1a2.89 2.89 0 012.12.88A2.89 2.89 0 0118 8v1.68c0 .293.102.587.305.88.203.293.435.44.695.44z" fill-rule="evenodd"/></svg>',
  'boolean': '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7 7h10a5 5 0 0 1 0 10H7A5 5 0 0 1 7 7zm10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill-rule="evenodd"/></svg>'
};

let iconHtml = name => ({ __html: ICONS[name] });

let measureText = (node, text) => {
  let v = document.createElement('span');
  v.style.position = 'absolute';
  v.style.left = '-9999px';
  v.style.top = '-9999px';
  v.style.visibility = 'hidden';
  v.style.whiteSpace = 'pre';
  v.textContent = text;
  document.body.appendChild(v);
  let w = v.offsetWidth;
  document.body.removeChild(v);
  return w;
}