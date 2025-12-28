import { useEffect, useState } from 'react';

import { loadData, saveData } from '../storage';

const usePersistedState = (key, defaultValue) => {
  const [state, setState] = useState(() => loadData(key) ?? defaultValue);

  useEffect(() => {
    saveData(key, state);
  }, [key, state]);

  return [state, setState];
};

export { usePersistedState };
