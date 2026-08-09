import { useState } from 'react';
import './app.css';
import { Tracker } from '../features/tracker/Tracker';
import { Calculator } from '../features/calculator/Calculator';

type Tab = 'tracker' | 'calculator';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('tracker');

  return (
    <main className="app">
      <nav className="tabs">
        <button
          type="button"
          className={activeTab === 'tracker' ? 'active' : ''}
          onClick={() => setActiveTab('tracker')}
        >
          Трекер
        </button>

        <button
          type="button"
          className={activeTab === 'calculator' ? 'active' : ''}
          onClick={() => setActiveTab('calculator')}
        >
          Калькулятор
        </button>
      </nav>

      {activeTab === 'tracker' ? <Tracker /> : <Calculator />}
    </main>
  );
}