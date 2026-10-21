import { useState } from 'react';
import { newGame, type NewGameSetup } from './engine/game';
import type { GameState } from './engine/types';
import { isRecorded, loadCodex, recordLife, saveCodex, type Codex, type LifeUnlocks } from './save/codex';
import { loadSave, saveGame } from './save/storage';
import { CodexScreen } from './ui/CodexScreen';
import { CreateScreen } from './ui/CreateScreen';
import { GameScreen } from './ui/GameScreen';
import { TitleScreen } from './ui/TitleScreen';

type Screen = 'title' | 'create' | 'game' | 'codex';

export function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [game, setGame] = useState<GameState | null>(() => loadSave());
  const [codex, setCodex] = useState<Codex>(() => loadCodex());
  const [unlocks, setUnlocks] = useState<LifeUnlocks | null>(null);
  const [codexBack, setCodexBack] = useState<Screen>('title');

  const updateGame = (s: GameState) => {
    if (s.phase === 'ended' && !isRecorded(codex, s)) {
      const r = recordLife(codex, s);
      setCodex(r.codex);
      saveCodex(r.codex);
      setUnlocks(r.unlocks);
    }
    setGame(s);
    saveGame(s);
  };

  const startLife = (setup: NewGameSetup) => {
    setUnlocks(null);
    updateGame(newGame(setup));
    setScreen('game');
  };

  const openCodex = (from: Screen) => {
    setCodexBack(from);
    setScreen('codex');
  };

  switch (screen) {
    case 'create':
      return <CreateScreen codex={codex} onStart={startLife} onBack={() => setScreen('title')} />;
    case 'game':
      return game ? (
        <GameScreen
          state={game}
          unlocks={unlocks}
          onChange={updateGame}
          onNewLife={() => setScreen('create')}
          onCodex={() => openCodex('game')}
          onExit={() => setScreen('title')}
        />
      ) : null;
    case 'codex':
      return <CodexScreen codex={codex} onBack={() => setScreen(codexBack)} />;
    default:
      return (
        <TitleScreen
          canContinue={Boolean(game && game.phase !== 'ended')}
          lives={codex.lives}
          onNew={() => setScreen('create')}
          onContinue={() => setScreen('game')}
          onCodex={() => openCodex('title')}
        />
      );
  }
}
