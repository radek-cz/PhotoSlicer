import { useState, type FormEvent } from "react";
import { useLocalization } from "../../lib/i18n/useLocalization";

const Photo = () => {
  const [image, setImage] = useState<string>();
  const { t } = useLocalization();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const base64 = formData.get("base")?.toString();
    if (base64) setImage(base64);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          {t("photo.inputLabel")}
          <textarea name="base" />
        </label>
        <input type="submit" value={t("photo.submit")} />
      </form>
      {image && <img src={image} alt={t("photo.imageAlt")} />}
    </>
  );
};

export default Photo;
