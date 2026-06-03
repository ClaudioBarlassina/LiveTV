import { useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';

const isTV = Platform.isTV || Platform.constants?.uiMode === 'tv';

export default function useTVFocus(options = {}) {
  const { onEnterPress, enabled = true } = options;
  const [focusedIndex, setFocusedIndex] = useState(0);
  const refs = useRef([]);

  const focusRef = useCallback((index) => {
    return (el) => {
      if (el) refs.current[index] = el;
    };
  }, []);

  const focusNext = useCallback(() => {
    setFocusedIndex((prev) => Math.min(prev + 1, refs.current.length - 1));
  }, []);

  const focusPrev = useCallback(() => {
    setFocusedIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const focusIndex = useCallback((index) => {
    setFocusedIndex(index);
  }, []);

  return {
    focusedIndex,
    setFocusedIndex,
    focusRef,
    focusNext,
    focusPrev,
    focusIndex,
    refs,
    isTV,
  };
}
