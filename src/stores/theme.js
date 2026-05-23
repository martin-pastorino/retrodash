import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem('RETRODASH_THEME') || 'dark');

  const initTheme = () => {
    document.documentElement.setAttribute('data-theme', theme.value);
  };

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
    localStorage.setItem('RETRODASH_THEME', theme.value);
    document.documentElement.setAttribute('data-theme', theme.value);
  };

  return {
    theme,
    initTheme,
    toggleTheme
  };
});
