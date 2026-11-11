import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, LoaderCircle, MapPin, Search, X } from "lucide-react";
import { buscarMunicipios, nomeMunicipio } from "../georadar";

export default function MunicipioSearch({ value, onChange, catalogo }) {
  const id = useId();
  const input = useRef(null);
  const [texto, setTexto] = useState(nomeMunicipio(value));
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  useEffect(() => {
    setTexto(nomeMunicipio(value));
  }, [value]);
  const consulta = texto === nomeMunicipio(value) ? value.nome : texto;
  const resultados = useMemo(
    () => buscarMunicipios(catalogo.data || [], consulta),
    [catalogo.data, consulta],
  );
  function selecionar(municipio) {
    setTexto(nomeMunicipio(municipio));
    setAberto(false);
    setAtivo(0);
    onChange(municipio);
  }
  function teclado(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setAberto(true);
      if (resultados.length)
        setAtivo(
          (i) =>
            (i + (event.key === "ArrowDown" ? 1 : -1) + resultados.length) %
            resultados.length,
        );
    } else if (event.key === "Enter" && aberto) {
      event.preventDefault();
      if (resultados[ativo]) selecionar(resultados[ativo]);
    } else if (event.key === "Escape") {
      setTexto(nomeMunicipio(value));
      setAberto(false);
    }
  }
  return (
    <div className="municipio-search">
      <label htmlFor={id}>Município</label>
      <div className="municipio-input">
        <Search size={17} />
        <input
          id={id}
          ref={input}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={aberto}
          aria-controls={id + "-resultados"}
          aria-activedescendant={
            aberto && resultados[ativo] ? id + "-opcao-" + ativo : undefined
          }
          value={texto}
          placeholder="Digite o nome do município"
          autoComplete="off"
          onChange={(e) => {
            setTexto(e.target.value);
            setAtivo(0);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => {
            setAberto(false);
            setTexto(nomeMunicipio(value));
          }}
          onKeyDown={teclado}
        />
        <button
          type="button"
          aria-label="Limpar busca de município"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setTexto("");
            setAberto(true);
            setAtivo(0);
            input.current?.focus();
          }}
        >
          <X size={15} />
        </button>
      </div>
      {aberto && (
        <div className="municipio-dropdown">
          {catalogo.loading ? (
            <p className="municipio-feedback">
              <LoaderCircle size={15} className="animate-spin" />
              Carregando municípios…
            </p>
          ) : catalogo.error ? (
            <div className="municipio-feedback">
              <p>{catalogo.error}</p>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={catalogo.reload}
              >
                Tentar novamente
              </button>
            </div>
          ) : consulta.trim().length < 2 ? (
            <p className="municipio-feedback">
              Digite pelo menos duas letras do nome.
            </p>
          ) : !resultados.length ? (
            <p className="municipio-feedback">
              Nenhum município encontrado. Experimente o nome e a UF.
            </p>
          ) : null}
          <ul
            id={id + "-resultados"}
            role="listbox"
            aria-label="Municípios encontrados"
          >
            {resultados.map((m, index) => (
              <li
                key={m.id}
                id={id + "-opcao-" + index}
                role="option"
                aria-selected={ativo === index}
                className={ativo === index ? "is-active" : ""}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selecionar(m)}
              >
                <MapPin size={17} />
                <span>
                  <strong>{m.nome}</strong>
                  <small>{m.uf}</small>
                </span>
                {value.id === m.id && <Check size={16} />}
              </li>
            ))}
          </ul>
          <small className="municipio-dropdown-note">
            Selecione um resultado para atualizar o GeoRadar.
          </small>
        </div>
      )}
    </div>
  );
}
