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

/** 投胎：只決定姓名與先天特質；出身與出生地由天命（種子）決定，出生後才揭曉。 */
export function CreateScreen({ codex, onStart, onBack }: Props) {
  const [seed] = useState(randomSeed);
  const [name, setName] = useState(() => randomName(new Rng(randomSeed())));
  const [trait, setTrait] = useState<string>();
  const traitOptions = useMemo(() => rollTraitOptions(seed, achievedEndings(codex)), [seed, codex]);

  const ready = Boolean(name.trim() && trait);

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

      <section className="create-section fate-note">
        <h3>出身與出生地</h3>
        <p className="muted">
          生在哪裡、生在誰家，由不得你。可能是{Object.values(CONTENT.backgrounds).map((b) => b.name).join('、')}；
          可能在{Object.values(CONTENT.regions).map((r) => r.name).join('、')}。落地之後才會知道。
        </p>
      </section>

      <div className="create-footer">
        <p className="muted">出生年份、家境與身體也會在出生時決定。</p>
        <button
          className="btn btn-primary"
          disabled={!ready}
          onClick={() => ready && onStart({ name, trait: trait!, seed })}
        >
          降生
        </button>
      </div>
    </main>
  );
}
