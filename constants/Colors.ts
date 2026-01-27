import { Palette } from './DesignSystem';

const tintColorLight = Palette.primary.main;
const tintColorDark = Palette.accent.main;

export default {
  light: {
    text: Palette.text.primary,
    background: Palette.background.default,
    tint: tintColorLight,
    tabIconDefault: Palette.text.disabled,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: Palette.text.primary, // Keeping light theme for now as per screenshots which are light mode
    background: Palette.background.default,
    tint: tintColorLight,
    tabIconDefault: Palette.text.disabled,
    tabIconSelected: tintColorLight,
  },
};
