import ReactECharts from 'echarts-for-react'
import { ALL_PAIRS_CAP, MUTED_OPACITY, usePalette } from '../../charts/palette'
import type { QueryEngine } from '../../data/engine'
import type { Card } from '../../store/types'
import { useCardQuery } from '../useCardQuery'
import { CardMessage, CardShell } from './CardShell'

export function ChartCard({ card, engine }: { card: Card; engine: QueryEngine }) {
  const { data, error, loading } = useCardQuery(card.sql, engine)
  const p = usePalette()

  let body
  if (error) body = <CardMessage text={error} tone="error" />
  else if (loading || !data) body = <CardMessage text="Running…" />
  else {
    const xi = data.columns.indexOf(card.x ?? '')
    const yi = data.columns.indexOf(card.y ?? '')
    const si = card.series ? data.columns.indexOf(card.series) : -1
    const highlights = card.highlights ?? []
    const isPie = card.chartType === 'pie'
    const isScatter = card.chartType === 'scatter'
    const echartsType = card.chartType === 'area' ? 'line' : card.chartType

    // Hues are assigned in fixed slot order and never cycled. Past the last
    // slot — or past the all-pairs cap on scatter — extra series fold away
    // rather than inventing a colour.
    const cap = isScatter ? ALL_PAIRS_CAP : p.series.length
    const allGroups =
      si >= 0 ? [...new Set(data.rows.map((r) => String(r[si])))] : [card.y ?? 'value']
    const groups = allGroups.slice(0, cap)
    const folded = allGroups.length - groups.length

    // Markers on every point of a long line is clutter; the hover layer still
    // exposes each value. Bars and scatter always keep their marks.
    const pointsPerSeries = si >= 0 ? data.rows.length / Math.max(1, allGroups.length) : data.rows.length
    const denseLine = (echartsType === 'line') && pointsPerSeries > 12

    const series = groups.map((g, gi) => {
      const rows = si >= 0 ? data.rows.filter((r) => String(r[si]) === g) : data.rows
      const colour = p.series[gi]
      return {
        name: String(g),
        type: echartsType,
        smooth: false,
        showSymbol: !denseLine,
        symbolSize: 8,
        lineStyle: { width: 2 },
        areaStyle: card.chartType === 'area' ? { opacity: 0.15 } : undefined,
        itemStyle: { color: colour, borderRadius: echartsType === 'bar' ? [4, 4, 0, 0] : 0 },
        data: rows.map((r) => {
          const x = String(r[xi])
          const y = Number(r[yi])
          // Focus and context: highlighted marks keep their series colour,
          // everything else recedes. Marks are never repainted.
          const dim = highlights.length > 0 && !highlights.includes(x)
          const style = { color: colour, opacity: dim ? MUTED_OPACITY : 1 }
          return isPie
            ? { name: x, value: y, itemStyle: style }
            : { value: [x, y], itemStyle: style }
        }),
      }
    })

    const option = isPie
      ? {
          tooltip: { trigger: 'item' },
          legend: { bottom: 0, textStyle: { color: p.textSecondary, fontSize: 11 } },
          series: [{ ...series[0], radius: ['48%', '72%'], label: { color: p.textSecondary } }],
        }
      : {
          tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
          // A legend is present for two or more series; one series is named
          // by the card title instead.
          legend:
            groups.length > 1
              ? { top: 0, textStyle: { color: p.textSecondary, fontSize: 11 } }
              : undefined,
          grid: { left: 52, right: 16, top: groups.length > 1 ? 34 : 12, bottom: 30 },
          barCategoryGap: '32%',
          barGap: '2%',
          xAxis: {
            type: 'category',
            axisTick: { show: false },
            axisLine: { lineStyle: { color: p.grid } },
            axisLabel: { color: p.axis, fontSize: 11 },
          },
          yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: p.axis, fontSize: 11 },
            splitLine: { lineStyle: { color: p.grid } },
          },
          series,
        }

    body = (
      <>
        <ReactECharts option={option} style={{ height: 230 }} notMerge lazyUpdate />
        {folded > 0 && (
          <p className="pt-1 text-[11px] text-neutral-400">
            {folded} more series not shown — narrow the query or facet it.
          </p>
        )}
      </>
    )
  }

  return (
    <CardShell id={card.id} title={card.title}>
      {body}
    </CardShell>
  )
}
