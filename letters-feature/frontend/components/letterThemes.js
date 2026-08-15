// Central registry of all letter stationery themes.
// Add a new theme by dropping the image into assets/letter-themes/
// and adding one entry here — nothing else needs to change.

import kraftHeart from '../assets/letter-themes/theme-kraft-heart.png';
import waxBlank from '../assets/letter-themes/theme-wax-blank.png';
import redLined from '../assets/letter-themes/theme-red-lined.png';
import hibiscusBow from '../assets/letter-themes/theme-hibiscus-bow.png';
import navyFloral from '../assets/letter-themes/theme-navy-floral.png';
import catLined from '../assets/letter-themes/theme-cat-lined.png';

export const LETTER_THEMES = {
  'kraft-heart': {
    id: 'kraft-heart',
    name: 'Kraft & Heart',
    image: kraftHeart,
    // text box position/size as % of image, tuned per-theme since each
    // template has a different amount of blank writing space
    textArea: { top: '12%', left: '10%', width: '80%', height: '68%' },
    textColor: '#4a2c1f',
    fontFamily: "'Caveat', cursive",
    fontSize: '1.35rem',
    lineHeight: '1.9',
  },
  'wax-blank': {
    id: 'wax-blank',
    name: 'Wax Seal Kraft',
    image: waxBlank,
    textArea: { top: '18%', left: '8%', width: '84%', height: '72%' },
    textColor: '#3d2418',
    fontFamily: "'Caveat', cursive",
    fontSize: '1.35rem',
    lineHeight: '1.9',
  },
  'red-lined': {
    id: 'red-lined',
    name: 'Ruled Red',
    image: redLined,
    textArea: { top: '18%', left: '15%', width: '70%', height: '65%' },
    textColor: '#2b1a12',
    fontFamily: "'Caveat', cursive",
    fontSize: '1.3rem',
    lineHeight: '2.05', // matched to the printed ruling
  },
  'hibiscus-bow': {
    id: 'hibiscus-bow',
    name: 'Hibiscus & Bow',
    image: hibiscusBow,
    textArea: { top: '20%', left: '10%', width: '78%', height: '68%' },
    textColor: '#4a1f1f',
    fontFamily: "'Caveat', cursive",
    fontSize: '1.35rem',
    lineHeight: '1.9',
  },
  'navy-floral': {
    id: 'navy-floral',
    name: 'Midnight Floral',
    image: navyFloral,
    textArea: { top: '15%', left: '10%', width: '80%', height: '72%' },
    textColor: '#1a1a2e',
    fontFamily: "'Caveat', cursive",
    fontSize: '1.35rem',
    lineHeight: '1.9',
  },
  'cat-lined': {
    id: 'cat-lined',
    name: 'Kittens & Stars',
    image: catLined,
    textArea: { top: '10%', left: '8%', width: '84%', height: '65%' },
    textColor: '#2b1a12',
    fontFamily: "'Caveat', cursive",
    fontSize: '1.3rem',
    lineHeight: '2.0',
  },
};

export const THEME_LIST = Object.values(LETTER_THEMES);

export const getTheme = (themeId) =>
  LETTER_THEMES[themeId] || LETTER_THEMES['kraft-heart'];
