import { ChangeEvent } from "react";

interface Props {
  className?: string;
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const ToggleSwitchButton = (props: Props) => (
  <div className={`c-toggle-switch-button ${props.className}`}>
    <input
      className="c-toggle-switch-button__input"
      id="btn-mode"
      type="checkbox"
      onChange={props.handleChange}
    />
    <label className="c-toggle-switch-button__label" htmlFor="btn-mode"></label>
  </div>
);
