import React, { useState } from 'react';
import Sidebar       from './components/Sidebar/Sidebar';
import KeyGenerator  from './components/KeyGenerator/KeyGenerator';

import './styles/global.scss';
import './App.scss';

const Chat = React.lazy(() => import('./components/Chat/Chat'));
export default function App() {
  const [page, setPage]   = useState('keygen');
  const [keys, setKeys]   = useState(null);
 
  function handleKeysGenerated(k) {
    setKeys(k);
  }
 
  return (
    <div className="app">
      <Sidebar
        active={page}
        onNavigate={setPage}
        keys={keys}
      />
 
      <main className="app__main">
        {page === 'keygen' && (
          <KeyGenerator
            onKeysGenerated={handleKeysGenerated}
            currentKeys={keys}
          />
        )}
        {page === 'chat' && (
          <Chat keys={keys} />
        )}
      </main>
    </div>
  );
}