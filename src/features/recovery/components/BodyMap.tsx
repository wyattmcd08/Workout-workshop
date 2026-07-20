import { Fragment } from 'react'
import type { MuscleGroup, MuscleRecoveryState } from '@/types'
import { MUSCLE_LABELS } from '@/types'
import { readinessTierColor } from '../utils/colors'

/**
 * Stylized front/back muscle map. Each muscle is an SVG region colored by
 * current readiness — fresh muscles sit quietly in green, fatigued ones glow
 * yellow → red. Regions are tappable for per-muscle detail.
 *
 * Coordinates describe the RIGHT side of a 200×420 figure; a mirrored group
 * renders the left side. `center` shapes (abs, lower back) render once.
 */

interface EllipseShape {
  kind: 'ellipse'
  muscle: MuscleGroup
  cx: number
  cy: number
  rx: number
  ry: number
  rotate?: number
  center?: boolean
}

interface PathShape {
  kind: 'path'
  muscle: MuscleGroup
  d: string
  center?: boolean
}

type MuscleShape = EllipseShape | PathShape

const FRONT_SHAPES: MuscleShape[] = [
  { kind: 'path', muscle: 'traps', d: 'M103,50 L132,62 C124,67 112,67 104,64 Z' },
  { kind: 'ellipse', muscle: 'front-delts', cx: 139, cy: 75, rx: 11, ry: 13, rotate: -18 },
  { kind: 'ellipse', muscle: 'side-delts', cx: 151, cy: 84, rx: 6.5, ry: 11, rotate: -10 },
  {
    kind: 'path',
    muscle: 'chest',
    d: 'M103,66 C116,64 130,70 135,80 C137,90 130,100 118,102 C110,103 104,100 103,94 Z',
  },
  { kind: 'ellipse', muscle: 'biceps', cx: 152, cy: 117, rx: 8.5, ry: 19, rotate: 6 },
  { kind: 'ellipse', muscle: 'forearms', cx: 158, cy: 165, rx: 7, ry: 22, rotate: 4 },
  { kind: 'path', muscle: 'abs', d: 'M89,108 h22 a9,9 0 0 1 9,9 v38 a11,11 0 0 1 -11,11 h-18 a11,11 0 0 1 -11,-11 v-38 a9,9 0 0 1 9,-9 Z', center: true },
  { kind: 'ellipse', muscle: 'obliques', cx: 119, cy: 133, rx: 6.5, ry: 25, rotate: 4 },
  { kind: 'ellipse', muscle: 'quads', cx: 121, cy: 232, rx: 14.5, ry: 42 },
  { kind: 'ellipse', muscle: 'adductors', cx: 105, cy: 212, rx: 6.5, ry: 26 },
  { kind: 'ellipse', muscle: 'calves', cx: 123, cy: 326, rx: 9, ry: 30 },
]

const BACK_SHAPES: MuscleShape[] = [
  { kind: 'path', muscle: 'traps', d: 'M100,46 L136,64 C128,76 112,88 100,94 Z' },
  { kind: 'ellipse', muscle: 'rear-delts', cx: 144, cy: 77, rx: 9.5, ry: 12, rotate: -14 },
  { kind: 'ellipse', muscle: 'upper-back', cx: 117, cy: 103, rx: 13, ry: 13 },
  {
    kind: 'path',
    muscle: 'lats',
    d: 'M104,98 C120,102 133,108 136,116 C134,134 122,150 108,158 C105,150 103,122 104,98 Z',
  },
  { kind: 'path', muscle: 'lower-back', d: 'M90,150 h20 a8,8 0 0 1 8,8 v14 a8,8 0 0 1 -8,8 h-20 a8,8 0 0 1 -8,-8 v-14 a8,8 0 0 1 8,-8 Z', center: true },
  { kind: 'ellipse', muscle: 'triceps', cx: 153, cy: 118, rx: 8.5, ry: 19, rotate: 6 },
  { kind: 'ellipse', muscle: 'forearms', cx: 158, cy: 165, rx: 7, ry: 22, rotate: 4 },
  { kind: 'ellipse', muscle: 'glutes', cx: 114, cy: 189, rx: 15, ry: 17 },
  { kind: 'ellipse', muscle: 'hamstrings', cx: 120, cy: 249, rx: 13.5, ry: 40 },
  { kind: 'ellipse', muscle: 'calves', cx: 122, cy: 328, rx: 10, ry: 31 },
]

/** Fresh muscles fade back; fatigued muscles come forward. */
function readinessOpacity(readiness: number): number {
  return 0.3 + ((100 - readiness) / 100) * 0.6
}

interface FigureProps {
  shapes: MuscleShape[]
  label: string
  readinessByMuscle: Map<MuscleGroup, number>
  selected: MuscleGroup | null
  onSelect: (muscle: MuscleGroup) => void
}

function Silhouette() {
  return (
    <g fill="rgb(255 255 255 / 0.05)" stroke="none">
      <circle cx={100} cy={30} r={16} />
      <rect x={92} y={42} width={16} height={14} rx={5} />
      {/* torso */}
      <path d="M66,56 L134,56 C144,60 148,72 147,84 L141,152 C139,168 126,178 100,178 C74,178 61,168 59,152 L53,84 C52,72 56,60 66,56 Z" />
      {/* pelvis */}
      <rect x={62} y={166} width={76} height={30} rx={15} />
      {/* limbs as round-capped strokes */}
      <g stroke="rgb(255 255 255 / 0.05)" strokeLinecap="round" fill="none">
        <line x1={147} y1={74} x2={160} y2={140} strokeWidth={23} />
        <line x1={160} y1={140} x2={166} y2={198} strokeWidth={17} />
        <line x1={53} y1={74} x2={40} y2={140} strokeWidth={23} />
        <line x1={40} y1={140} x2={34} y2={198} strokeWidth={17} />
        <line x1={120} y1={192} x2={124} y2={288} strokeWidth={34} />
        <line x1={124} y1={288} x2={122} y2={372} strokeWidth={23} />
        <line x1={80} y1={192} x2={76} y2={288} strokeWidth={34} />
        <line x1={76} y1={288} x2={78} y2={372} strokeWidth={23} />
      </g>
      <circle cx={168} cy={208} r={7} />
      <circle cx={32} cy={208} r={7} />
      <ellipse cx={124} cy={382} rx={13} ry={7} />
      <ellipse cx={76} cy={382} rx={13} ry={7} />
    </g>
  )
}

function MuscleRegion({
  shape,
  readiness,
  selected,
  onSelect,
}: {
  shape: MuscleShape
  readiness: number
  selected: boolean
  onSelect: (muscle: MuscleGroup) => void
}) {
  const common = {
    fill: readinessTierColor(readiness),
    fillOpacity: readinessOpacity(readiness),
    stroke: selected ? 'rgb(255 255 255 / 0.9)' : 'var(--color-bg)',
    strokeWidth: selected ? 1.75 : 1,
    style: { cursor: 'pointer', transition: 'fill-opacity 0.4s ease' },
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation()
      onSelect(shape.muscle)
    },
  }
  if (shape.kind === 'ellipse') {
    return (
      <ellipse
        cx={shape.cx}
        cy={shape.cy}
        rx={shape.rx}
        ry={shape.ry}
        transform={shape.rotate ? `rotate(${shape.rotate} ${shape.cx} ${shape.cy})` : undefined}
        {...common}
      />
    )
  }
  return <path d={shape.d} {...common} />
}

function Figure({ shapes, label, readinessByMuscle, selected, onSelect }: FigureProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <svg viewBox="0 0 200 420" className="w-full max-w-44" role="img" aria-label={`${label} muscle map`}>
        <Silhouette />
        {shapes.map((shape, index) => {
          const readiness = readinessByMuscle.get(shape.muscle) ?? 100
          const region = (mirrored: boolean) => (
            <MuscleRegion
              key={`${shape.muscle}-${index}-${mirrored ? 'l' : 'r'}`}
              shape={shape}
              readiness={readiness}
              selected={selected === shape.muscle}
              onSelect={onSelect}
            />
          )
          if (shape.center) return <Fragment key={`${shape.muscle}-${index}`}>{region(false)}</Fragment>
          return (
            <Fragment key={`${shape.muscle}-${index}`}>
              {region(false)}
              <g transform="scale(-1 1) translate(-200 0)">{region(true)}</g>
            </Fragment>
          )
        })}
      </svg>
      <span className="text-[11px] font-semibold tracking-wide text-content-tertiary uppercase">
        {label}
      </span>
    </div>
  )
}

interface BodyMapProps {
  states: MuscleRecoveryState[]
  selected: MuscleGroup | null
  onSelect: (muscle: MuscleGroup) => void
}

export function BodyMap({ states, selected, onSelect }: BodyMapProps) {
  const readinessByMuscle = new Map(states.map((s) => [s.muscle, Math.round(s.readiness)]))

  return (
    <div>
      <div className="flex gap-2">
        <Figure
          shapes={FRONT_SHAPES}
          label="Front"
          readinessByMuscle={readinessByMuscle}
          selected={selected}
          onSelect={onSelect}
        />
        <Figure
          shapes={BACK_SHAPES}
          label="Back"
          readinessByMuscle={readinessByMuscle}
          selected={selected}
          onSelect={onSelect}
        />
      </div>
      <div className="mt-3 flex items-center justify-center gap-4">
        {[
          { label: 'Fresh', color: 'var(--color-accent)' },
          { label: 'Working', color: 'var(--color-yellow)' },
          { label: 'Fatigued', color: 'var(--color-red)' },
        ].map((tier) => (
          <span key={tier.label} className="flex items-center gap-1.5 text-[11px] text-content-secondary">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
            {tier.label}
          </span>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-content-tertiary">
        Tap a muscle to inspect it{selected ? ` · ${MUSCLE_LABELS[selected]} selected` : ''}
      </p>
    </div>
  )
}
