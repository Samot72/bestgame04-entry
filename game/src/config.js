// Mahjong Garden's shared numbers: the 1280x720 stage, the tile geometry
// (tiles live on a half-tile grid, so a tile spans 2x2 grid units), the
// scoring rules, and the colours of the felt, the tiles and the ink.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const STEP = 1 / 60;
export const MAX_FRAME = 0.25;

// Tile pixel size and the half-tile grid unit it spans (2 units per tile).
export const TILE_W = 52;
export const TILE_H = 68;
export const HX = TILE_W / 2; // 26 px per grid unit across
export const HY = TILE_H / 2; // 34 px per grid unit down

// Each layer up steps the tile this far up-left, so stacks read as stacks.
export const LAYER_DX = -5;
export const LAYER_DY = -5;
// The drawn thickness of a tile: a lip below and to the right of the face.
export const TILE_LIP = 5;

// The board plays in the stage left of the side panel; the HUD owns the rest.
export const PANEL_X = 1064;
export const TOPBAR_H = 58;

export const HINTS_PER_DEAL = 5;
export const SHUFFLES_PER_DEAL = 3;
export const COMBO_WINDOW = 5; // seconds between matches to keep a combo alive
export const COMBO_MAX = 5;
export const PAIR_SCORE = 100;
export const HINT_BONUS = 20; // per unused hint, paid on a win
export const SHUFFLE_BONUS = 50; // per unused shuffle, paid on a win

export const COLORS = {
  feltEdge: '#041f10',
  feltMid: '#0b3d20',
  feltCore: '#176b36',
  feltLine: 'rgba(255, 235, 170, 0.05)',
  gold: '#e8c35a',
  goldSoft: '#c9a227',
  cream: '#fff6dd',
  ink: '#2b2118',
  tileFace: '#f3ead2',
  tileFaceHi: '#fffdf4',
  tileEdge: '#d8cba3',
  tileSide: '#a08c5f',
  tileShadow: 'rgba(0, 0, 0, 0.38)',
  blocked: 'rgba(10, 26, 14, 0.20)',
  panel: 'rgba(4, 26, 13, 0.93)',
  panelLine: 'rgba(232, 195, 90, 0.4)',
  red: '#c03428',
  green: '#2e7d32',
  blue: '#20508f',
  navy: '#1d3a6e',
  pink: '#d4698f',
};

export const SERIF = 'Georgia, "Times New Roman", "Liberation Serif", serif';
export const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
