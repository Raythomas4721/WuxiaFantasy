import { CONTENT } from '../content';
import type { Codex } from '../save/codex';

export function CodexScreen({ codex, onBack }: { codex: Codex; onBack: () => void }) {
  const endings = [...CONTENT.endings].sort((a, b) => b.priority - a.priority);
  const npcs = Object.values(CONTENT.npcs).filter((n) => n.codex);
  const rare = CONTENT.events.filter((e) => e.rare);
  const got = endings.filter((e) => codex.endings[e.id]).length;

  return (
    <main className="page codex">
      <header className="page-header">
        <button className="btn btn-ghost btn-small" onClick={onBack}>
          ← 返回
        </button>
        <h2>江湖傳聞錄</h2>
      </header>
      <p className="muted">已走過 {codex.lives} 世</p>

      <section className="codex-section">
        <h3>結局 <small>{got} / {endings.length}</small></h3>
        <div className="codex-grid">
          {endings.map((e) => {
            const n = codex.endings[e.id];
            return (
              <div key={e.id} className={`codex-card ${n ? '' : 'locked'}`}>
                <span className="pick-title">{n ? e.title : '？？？'}</span>
                <span className="pick-desc">{e.hint}</span>
                {n && <span className="codex-count">達成 {n} 次</span>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="codex-section">
        <h3>名俠 <small>{npcs.filter((n) => codex.npcs.includes(n.id)).length} / {npcs.length}</small></h3>
        <div className="codex-grid">
          {npcs.map((n) => {
            const met = codex.npcs.includes(n.id);
            return (
              <div key={n.id} className={`codex-card ${met ? '' : 'locked'}`}>
                <span className="pick-title">{met ? `${n.title ? `「${n.title}」` : ''}${n.name}` : '？？？'}</span>
                <span className="pick-desc">{met ? n.desc : '尚未在江湖中相遇。'}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="codex-section">
        <h3>奇遇 <small>{rare.filter((e) => codex.rare.includes(e.id)).length} / {rare.length}</small></h3>
        <div className="codex-grid">
          {rare.map((e) => {
            const seen = codex.rare.includes(e.id);
            return (
              <div key={e.id} className={`codex-card ${seen ? '' : 'locked'}`}>
                <span className="pick-title">{seen ? e.title : '？？？'}</span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
