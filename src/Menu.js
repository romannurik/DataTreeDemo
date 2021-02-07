import cn from 'classnames';
import './Menu.scss';

export function MenuItem({ title, selected, iconSvg, onClick }) {
  return <div className={cn('menu-item', { 'is-selected': selected })}
    tabIndex={0}
    onClick={onClick}>
    {iconSvg && <div className="menu-item-icon" dangerouslySetInnerHTML={iconSvg}></div>}
    <span>{title}</span>
  </div>;
}

export function Menu({ open, children, onClose }) {
  return <>
    <div className={cn('menu', { 'is-open': open })}>
      {children}
    </div>
    {open && <div className="menu-scrim" tabIndex={0} onClick={onClose} />}
  </>;
}