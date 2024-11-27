// @/constants/Colors.ts

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#D1D5DB', // Tilføjet en border-farve til light temaet
    designer: '#c7db54', // Lysegrøn farve for designer
    admin: '#ec1c24', // Lyserød farve for admin
    danger: '#ff0000', // Rød farve for danger
    primary: '#0a7ea4', // Blå farve for primary
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#374151', // Tilføjet en border-farve til dark temaet
    designer: '#c7db54', // Lysegrøn farve for designer
    admin: '#ec1c24', // Lyserød farve for admin
    danger: '#ff0000', // Rød farve for danger
  },
};