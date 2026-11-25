import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { kindLabel, palettes, zoneOptions } from "../data";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { fileToDataUrl } from "../images";
import { patterns } from "../validators";
import { Icon } from "../ui";

const MAX_PHOTOS = 3;

const textFields = [
  { name: "price", label: "Precio (USD)", placeholder: "180000", rule: patterns.price, msg: "Escribe solo números, entre 4 y 8 dígitos." },
  { name: "area", label: "Construcción (m²)", placeholder: "120", rule: patterns.area, msg: "Entre 2 y 4 dígitos." },
  { name: "beds", label: "Habitaciones", placeholder: "3", rule: patterns.smallInt, msg: "Escribe un número de 1 o 2 dígitos." },
  { name: "baths", label: "Baños", placeholder: "2", rule: patterns.smallInt, msg: "Escribe un número de 1 o 2 dígitos." },
  { name: "parking", label: "Puestos de estacionamiento", placeholder: "2", rule: patterns.smallInt, msg: "Escribe un número de 1 o 2 dígitos." },
  { name: "year", label: "Año de construcción", placeholder: "2018", rule: patterns.year, msg: "Escribe un año entre 1950 y 2029." },
  { name: "fee", label: "Cuota mensual (USD)", placeholder: "150", rule: patterns.monthlyFee, msg: "Indica una cuota mensual mayor que cero (hasta 5 dígitos)." },
];

const empty = {
  title: "", zone: zoneOptions[0], kind: "casa", price: "", area: "", beds: "", baths: "",
  parking: "", year: "", fee: "", description: "", features: "",
};

export default function NuevoInmueble() {
  const { user } = useAuth();
  const { actions } = useStore();
  const navigate = useNavigate();
  const [values, setValues] = useState(empty);
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [photoError, setPhotoError] = useState("");

  const rule = (name) =>
    name === "title" ? [patterns.listingTitle, "El título debe tener entre 6 y 80 caracteres."]
    : name === "description" ? [patterns.description, "La descripción debe tener entre 20 y 600 caracteres."]
    : name === "features" ? [patterns.features, "Separa hasta 6 características con comas (2 a 40 letras cada una)."]
    : (() => { const f = textFields.find((x) => x.name === name); return [f.rule, f.msg]; })();

  const validate = (name, value) => {
    const [re, msg] = rule(name);
    if (!re.test(value.trim())) return msg;
    if (name === "fee" && Number(value) <= 0) return msg;
    return "";
  };

  const change = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: validate(name, value) }));
  };

  const addPhotos = async (e) => {
    const files = [...e.target.files].slice(0, MAX_PHOTOS - photos.length);
    e.target.value = "";
    setPhotoError("");
    for (const file of files) {
      if (!patterns.imageType.test(file.type)) {
        setPhotoError("Solo se permiten fotos JPG, PNG o WebP.");
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setPhotoError("Cada foto debe pesar menos de 10 MB.");
        continue;
      }
      try {
        const url = await fileToDataUrl(file);
        setPhotos((p) => (p.length < MAX_PHOTOS ? [...p, url] : p));
      } catch (err) {
        setPhotoError(err.message);
      }
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const names = ["title", ...textFields.map((f) => f.name), "description", "features"];
    const next = {};
    names.forEach((n) => {
      const msg = validate(n, values[n]);
      if (msg) next[n] = msg;
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    const description = values.description.trim();
    const id = actions.addListing(
      {
        buildingId: null,
        title: values.title.trim(),
        zone: values.zone,
        kind: values.kind,
        price: Number(values.price),
        area: Number(values.area),
        beds: Number(values.beds),
        baths: Number(values.baths),
        parking: Number(values.parking),
        year: Number(values.year),
        fee: Number(values.fee),
        tag: "Nuevo",
        featured: false,
        palette: palettes[photos.length + values.title.length % palettes.length],
        images: photos,
        description,
        blurb: description.length > 90 ? `${description.slice(0, 87)}…` : description,
        features: values.features.split(",").map((s) => s.trim()).filter(Boolean),
      },
      user.id
    );
    navigate(`/propiedad/${id}`);
  };

  const field = (f) => (
    <label key={f.name}>
      {f.label}
      <input name={f.name} inputMode="numeric" value={values[f.name]} placeholder={f.placeholder} onChange={change} aria-invalid={Boolean(errors[f.name])} />
      {errors[f.name] && <span className="field-error" role="alert">{errors[f.name]}</span>}
    </label>
  );

  return (
    <>
      <div className="page-head">
        <h1>Publicar inmueble</h1>
        <p className="muted">Completa los datos. La cuota mensual configurada se cobrará a tu cuenta de propietario.</p>
      </div>

      <form className="glass panel" onSubmit={submit} noValidate>
        <label>
          Título del anuncio
          <input name="title" value={values.title} placeholder="Casa amplia con piscina" onChange={change} aria-invalid={Boolean(errors.title)} />
          {errors.title && <span className="field-error" role="alert">{errors.title}</span>}
        </label>

        <div className="row">
          <label>
            Zona
            <select name="zone" value={values.zone} onChange={change}>
              {zoneOptions.map((z) => <option key={z}>{z}</option>)}
            </select>
          </label>
          <label>
            Tipo de inmueble
            <select name="kind" value={values.kind} onChange={change}>
              {Object.entries(kindLabel).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </label>
        </div>

        <div className="form-grid">{textFields.map(field)}</div>

        <label>
          Descripción
          <textarea name="description" rows="4" value={values.description} onChange={change} aria-invalid={Boolean(errors.description)} placeholder="Cuenta lo mejor de tu inmueble" />
          {errors.description && <span className="field-error" role="alert">{errors.description}</span>}
        </label>

        <label>
          Características (separadas por comas, opcional)
          <input name="features" value={values.features} onChange={change} placeholder="Piscina, Planta eléctrica, Vigilancia" aria-invalid={Boolean(errors.features)} />
          {errors.features && <span className="field-error" role="alert">{errors.features}</span>}
        </label>

        <div className="upload">
          <span className="upload-label">Fotos (hasta {MAX_PHOTOS}, JPG, PNG o WebP)</span>
          <div className="photo-row">
            {photos.map((src, i) => (
              <div key={src.slice(-24) + i} className="photo-preview">
                <img src={src} alt={`Foto ${i + 1}`} />
                <button type="button" aria-label="Quitar foto" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="photo-add">
                <Icon name="plus" size={22} />
                <span>Agregar</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos} />
              </label>
            )}
          </div>
          {photoError && <span className="field-error" role="alert">{photoError}</span>}
        </div>

        <div className="actions">
          <button className="btn btn-primary" type="submit">Publicar inmueble</button>
          <Link className="btn btn-glass" to="/portal/inmuebles">Cancelar</Link>
        </div>
      </form>
    </>
  );
}
