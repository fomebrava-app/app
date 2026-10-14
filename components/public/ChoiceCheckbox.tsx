export function ChoiceCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <span className="choice-checkbox">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="checkmark" />
    </span>
  );
}
