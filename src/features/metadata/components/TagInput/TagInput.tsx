import { useState, type KeyboardEvent } from "react";
import { useLocalization } from "../../../../lib/i18n/useLocalization";
import "./TagInput.css";

interface Props {
  label: string;
  inputLabel: string;
  tags: string[];
  disabled?: boolean;
  onChange: (tags: string[]) => void;
}

export const TagInput = ({
  label,
  inputLabel,
  tags,
  disabled = false,
  onChange,
}: Props) => {
  const [value, setValue] = useState("");
  const { t } = useLocalization();

  const addTag = () => {
    const tag = value.trim();
    if (!tag || tags.some((existing) => existing.toLocaleLowerCase() === tag.toLocaleLowerCase())) {
      return;
    }
    onChange([...tags, tag]);
    setValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    }
  };

  return (
    <div className="tag-field">
      <span className="field-label">{label}</span>
      <ul className="tag-list" aria-label={label}>
        {tags.map((tag, index) => (
          <li key={`${tag}-${index}`}>
            <span>{tag}</span>
            <button
              aria-label={t("image.metadata.tags.remove", { tag })}
              disabled={disabled}
              type="button"
              onClick={() => onChange(tags.filter((_, item) => item !== index))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="tag-entry">
        <input
          aria-label={inputLabel}
          disabled={disabled}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button disabled={disabled || !value.trim()} type="button" onClick={addTag}>
          {t("image.metadata.tags.add")}
        </button>
      </div>
    </div>
  );
};
