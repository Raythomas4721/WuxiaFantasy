import { useMemo, useState } from 'react';
import { CONTENT } from '../content';
import { randomName, rollTraitOptions, type NewGameSetup } from '../engine/game';
import { Rng, randomSeed } from '../engine/rng';
import { achievedEndings, type Codex } from '../save/codex';

interface Props {
  codex: Codex;
  onStart: (setup: NewGameSetup) => void;
  onBack: () => void;
}

export function CreateScreen({ codex, onStart, onBack }: Props) {
  const [seed] = useState(randomSeed);
  const [name, setName] = useState(() => randomName(new Rng(randomSeed())));
  const [background, setBackground] = useState<string>();
  const [region, setRegion] = useState<string>();
  const [trait, setTrait] = useState<string>();
  const traitOptions = useMemo(() => rollTraitOptions(seed, achievedEndings(codex)), [seed, codex]);

  const ready = Boolean(name.trim() && background && region && trait);

  return (
    <main className="page create-screen">
      <header className="page-header">
        <button className="btn btn-ghost btn-small" onClick={onBack}>
          ← 返回
        </button>
        <h2>投胎</h2>
      </header>

      <section className="create-section">
        <h3>姓名</h3>
        <div className="name-row">
          <input
            className="name-input"
            value={name}
            maxLength={6}
            onChange={(e) => setName(e.target.value)}
            aria-label="姓名"
          />
          <button className="btn btn-small" onClick={() => setName(randomName(new Rng(randomSeed())))}>
            隨機
          </button>
        </div>
      </section>

      <section className="create-section">
        <h3>出身</h3>
        <div className="card-grid">
          {Object.values(CONTENT.backgrounds).map((b) => (
            <button
              key={b.id}
              className={`pick-card ${background === b.id ? 'selected' : ''}`}
              onClick={() => setBackground(b.id)}
            >
              <span className="pick-title">{b.name}</span>
              <span className="pick-desc">{b.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="create-section">
        <h3>出生地</h3>
        <div className="card-grid">
          {Object.values(CONTENT.regions).map((r) => (
            <button
              key={r.id}
              className={`pick-card ${region === r.id ? 'selected' : ''}`}
              onClick={() => setRegion(r.id)}
            >
              <span className="pick-title">{r.name}</span>
              <span className="pick-desc">{r.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="create-section">
        <h3>先天特質 <small>（天命所賜，三選一）</small></h3>
        <div className="card-grid">
          {traitOptions.map((id) => {
            const t = CONTENT.traits[id];
            return (
              <button
                key={id}
                className={`pick-card ${trait === id ? 'selected' : ''} ${t.unlockedBy ? 'unlocked' : ''}`}
                onClick={() => setTrait(id)}
              >
                <span className="pick-title">{t.name}</span>
                <span className="pick-desc">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="create-footer">
        <p className="muted">出生年份、家境與身體會在出生時隨機決定。</p>
        <button
          className="btn btn-primary"
          disabled={!ready}
          onClick={() => ready && onStart({ name, background: background!, region: region!, trait: trait!, seed })}
        >
          降生
        </button>
      </div>
    </main>
  );
}
