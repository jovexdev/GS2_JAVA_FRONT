import { useRef, useState } from "react";
import { ArrowUp, MessageCircle, Sparkles } from "lucide-react";
import { api } from "../api";
import { Alert, Button, PageTitle } from "../components/ui";
export default function Lia() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [context, setContext] = useState(false);
  const end = useRef(null);
  async function submit(e) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    const question = text.trim();
    setBusy(true);
    setError("");
    try {
      const response = await api("/lia", {
        method: "POST",
        body: {
          pergunta: question,
          ...(context
            ? { municipio: 3550308, ano: new Date().getFullYear() - 1 }
            : {}),
        },
      });
      setMessages((m) => [
        ...m,
        { role: "user", text: question },
        { role: "assistant", text: response.resposta },
      ]);
      setText("");
      setTimeout(
        () => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
        60,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="INFORMAÇÃO QUE ORIENTA"
        title="Converse com a LIA"
        description="Sua assistente para entender informações sobre dengue e prevenção."
      />
      <section className="card chat-card">
        <header className="chat-header">
          <span className="lia-avatar">
            <Sparkles size={22} />
          </span>
          <div>
            <h2>LIA</h2>
            <p>Assistente de informação do AEGIS</p>
          </div>
          <span className="role-chip">Inteligência artificial</span>
        </header>
        <div className="chat-messages" aria-live="polite">
          {!messages.length ? (
            <div className="chat-welcome">
              <span className="lia-welcome-icon">
                <MessageCircle size={32} />
              </span>
              <h2>Vamos conversar sobre prevenção?</h2>
              <p>Faça uma pergunta ou escolha um assunto para começar.</p>
              <div className="chat-suggestions">
                {[
                  "Como posso ajudar na prevenção da dengue?",
                  "Como interpretar os indicadores do município?",
                  "O que devo informar em uma ocorrência?",
                ].map((q) => (
                  <button key={q} onClick={() => setText(q)}>
                    {q}
                    <ArrowUp size={15} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <article key={i} className={"chat-bubble " + m.role}>
                <strong>{m.role === "user" ? "Você" : "LIA"}</strong>
                <p>{m.text}</p>
              </article>
            ))
          )}
          {busy && (
            <div className="chat-thinking" role="status">
              <span />
              <span />
              <span /> LIA está preparando uma resposta…
            </div>
          )}
          <div ref={end} />
        </div>
        <div className="chat-bottom">
          <Alert>{error}</Alert>
          <form onSubmit={submit}>
            <label className="checkbox-row text-sm">
              <input
                type="checkbox"
                checked={context}
                onChange={(e) => setContext(e.target.checked)}
              />
              Incluir indicadores de São Paulo do último ano completo
            </label>
            <div className="chat-input">
              <textarea
                aria-label="Mensagem para LIA"
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                maxLength={1200}
                rows={2}
                placeholder="O que você gostaria de saber?"
              />
              <Button
                aria-label="Enviar mensagem"
                busy={busy}
                disabled={!text.trim()}
                type="submit"
              >
                <ArrowUp size={20} />
              </Button>
            </div>
          </form>
          <p className="form-note">
            A LIA pode cometer erros. Confira informações nas fontes oficiais e
            evite compartilhar dados pessoais.
          </p>
        </div>
      </section>
    </>
  );
}
