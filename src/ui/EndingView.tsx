import { CONTENT } from '../content';
import type { GameState } from '../engine/types';
import type { LifeUnlocks } from '../save/codex';

interface Props {
  state: GameState;
  unlocks: LifeUnlocks | null;
  onNewLife: () => void;
  onCodex: () => void;
  onExit: () => void;
}

export function EndingView({ state, unlocks, onNewLife, onCodex, onExit }: Props) {
  const e = state.ending!;
  const p = state.player;
  const bg = CONTENT.backgrounds[p.background];

  return (
    <main className="page ending">
      <p className="ending-who">
        {p.name} · {bg.name} · {p.birthYear}–{p.birthYear + p.age}
      </p>
      <h1 className="ending-title">{e.title}</h1>
      <p className="ending-death">{e.deathLine}</p>

      <div className="story ending-text">
        <p>{e.text}</p>
      </div>

      {e.ambition && (
        <section className={`ending-ambition ${e.ambition.fulfilled ? 'fulfilled' : 'unfulfilled'}`}>
          <span className="ambition-tag">
            志向・{e.ambition.name}・{e.ambition.fulfilled ? '圓滿' : '遺憾'}
          </span>
          <p>{e.ambition.text}</p>
        </section>
      )}

      {e.eraLine && <p className="ending-era">{e.eraLine}</p>}

      {e.recaps.length > 0 && (
        <section className="ending-recaps">
          <h3>人生回顧</h3>
          <ul>
            {e.recaps.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {unlocks && (unlocks.newEnding || unlocks.newNpcs.length > 0 || unlocks.newTraits.length > 0 || unlocks.newRare.length > 0) && (
        <section className="ending-unlocks">
          <h3>江湖傳聞錄新增</h3>
          <ul>
            {unlocks.newEnding && <li>結局「{e.title}」</li>}
            {unlocks.newNpcs.map((id) => (
              <li key={id}>名俠「{CONTENT.npcs[id].name}」</li>
            ))}
            {unlocks.newRare.map((id) => (
              <li key={id}>奇遇「{CONTENT.events.find((x) => x.id === id)?.title}」</li>
            ))}
            {unlocks.newTraits.map((id) => (
              <li key={id} className="unlock-trait">
                解鎖先天特質「{CONTENT.traits[id].name}」
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="actions ending-actions">
        <button className="btn btn-primary" onClick={onNewLife}>
          再世為人
        </button>
        <button className="btn" onClick={onCodex}>
          江湖傳聞錄
        </button>
        <button className="btn btn-ghost" onClick={onExit}>
          回到標題
        </button>
      </div>
    </main>
  );
}
