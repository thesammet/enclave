import { useTheme } from '../store/theme'

/**
 * Values from the dataviz skill's reference palette, validated with its
 * script in both modes (adjacent pairlist):
 *   light — worst CVD ΔE 9.1, worst normal-vision ΔE 19.6
 *   dark  — worst CVD ΔE 8.4, worst normal-vision ΔE 19.3, all slots ≥3:1
 *
 * The slot ORDER is the colourblind-safety mechanism, not decoration. Assign
 * hues in this order and never cycle: a ninth series folds into "Other".
 * Charts that put every pair on screen at once (scatter) are capped at the
 * first three slots, which validate under --pairs all.
 *
 * Light mode leaves aqua, yellow and magenta below 3:1 on the surface, which
 * the validator flags as needing relief. Enclave's relief is the legend that
 * is always present for two or more series, plus the table card and tooltips.
 */
export const SERIES_LIGHT = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
]

export const SERIES_DARK = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
]

/** Scatter and other all-pairs forms must not exceed this many series. */
export const ALL_PAIRS_CAP = 3

/**
 * highlight_points uses focus-and-context: highlighted marks keep their own
 * series colour at full opacity and everything else recedes to this. Marks are
 * never repainted to a signal colour — colour follows the entity, not its rank.
 */
export const MUTED_OPACITY = 0.25

export const LIGHT = {
  surface: '#fcfcfb',
  textPrimary: '#0b0b0b',
  textSecondary: '#52514e',
  axis: '#8a8985',
  grid: '#e9e8e4',
  series: SERIES_LIGHT,
}

export const DARK = {
  surface: '#1a1a19',
  textPrimary: '#ffffff',
  textSecondary: '#c3c2b7',
  axis: '#7b7a74',
  grid: '#2c2c2a',
  series: SERIES_DARK,
}

/** Charts follow the same theme the rest of the page does. */
export function usePalette() {
  return useTheme((s) => s.theme) === 'dark' ? DARK : LIGHT
}
