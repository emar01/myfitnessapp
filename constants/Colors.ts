import { DarkPalette, LightPalette } from './DesignSystem';

const tintColorLight = LightPalette.primary.main;
const tintColorDark = DarkPalette.primary.main;

export default {
  light: {
    text: LightPalette.text.primary,
    background: LightPalette.background.default,
    tint: tintColorLight,
    tabIconDefault: LightPalette.text.disabled,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: DarkPalette.text.primary,
    background: DarkPalette.background.default,
    tint: tintColorDark,
    tabIconDefault: DarkPalette.text.disabled,
    tabIconSelected: tintColorDark,
  },
};
