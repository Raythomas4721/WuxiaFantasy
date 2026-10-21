interface Props {
  canContinue: boolean;
  lives: number;
  onNew: () => void;
  onContinue: () => void;
  onCodex: () => void;
}

export function TitleScreen({ canContinue, lives, onNew, onContinue, onCodex }: Props) {
  return (
    <main className="title-screen">
      <div className="title-block">
        <p className="title-era">南宋末年 · 宋蒙五十年</p>
        <h1 className="title-name">江湖一生</h1>
        <p className="title-sub">生於亂世，走一遭屬於你的江湖。</p>
      </div>
      <div className="title-actions">
        {canContinue && (
          <button className="btn btn-primary" onClick={onContinue}>
            繼續這一生
          </button>
        )}
        <button className={canContinue ? 'btn' : 'btn btn-primary'} onClick={onNew}>
          新的一生
        </button>
        <button className="btn btn-ghost" onClick={onCodex}>
          江湖傳聞錄
        </button>
      </div>
      {lives > 0 && <p className="title-lives">你已在江湖裡走過 {lives} 世</p>}
    </main>
  );
}
