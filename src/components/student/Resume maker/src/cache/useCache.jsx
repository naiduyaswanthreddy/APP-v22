import { useState, useEffect } from 'react';

const cache = {};

export const useCache = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    if (cache[key]) {
      return cache[key];
    }
    const savedValue = localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : initialValue;
  });

  useEffect(() => {
    cache[key] = value;
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};
