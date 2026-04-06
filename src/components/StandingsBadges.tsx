type TitleProps = { title: string }

export function BadgeQualified({ title }: TitleProps) {
  return (
    <span className="standings-badge" title={title}>
      <svg
        className="standings-badge__svg standings-badge__svg--q"
        viewBox="0 0 26 20"
        width="26"
        height="20"
        aria-hidden="true"
      >
        <rect
          x="0.5"
          y="0.5"
          width="25"
          height="19"
          rx="5"
          fill="rgba(34, 197, 94, 0.35)"
          stroke="rgba(34, 197, 94, 0.55)"
          strokeWidth="1"
        />
        <text
          x="13"
          y="14"
          textAnchor="middle"
          fontSize="11"
          fontWeight="800"
          fill="#bbf7d0"
          fontFamily="system-ui, Segoe UI, sans-serif"
        >
          Q
        </text>
      </svg>
    </span>
  )
}

export function BadgeThirdPlace({ title }: TitleProps) {
  return (
    <span className="standings-badge" title={title}>
      <svg
        className="standings-badge__svg standings-badge__svg--third"
        viewBox="0 0 26 20"
        width="26"
        height="20"
        aria-hidden="true"
      >
        <rect
          x="0.5"
          y="0.5"
          width="25"
          height="19"
          rx="5"
          fill="rgba(234, 179, 8, 0.35)"
          stroke="rgba(234, 179, 8, 0.55)"
          strokeWidth="1"
        />
        <text
          x="13"
          y="14"
          textAnchor="middle"
          fontSize="11"
          fontWeight="800"
          fill="#fef08a"
          fontFamily="system-ui, Segoe UI, sans-serif"
        >
          3
        </text>
      </svg>
    </span>
  )
}

/** One of the eight best third-place teams (cross-group ranking). */
export function BadgeThirdAdvances({ title }: TitleProps) {
  return (
    <span className="standings-badge" title={title}>
      <svg
        className="standings-badge__svg standings-badge__svg--third-adv"
        viewBox="0 0 34 20"
        width="34"
        height="20"
        aria-hidden="true"
      >
        <rect
          x="0.5"
          y="0.5"
          width="33"
          height="19"
          rx="5"
          fill="rgba(34, 197, 94, 0.22)"
          stroke="rgba(34, 197, 94, 0.55)"
          strokeWidth="1"
        />
        <text
          x="17"
          y="14"
          textAnchor="middle"
          fontSize="10"
          fontWeight="800"
          fill="#86efac"
          fontFamily="system-ui, Segoe UI, sans-serif"
        >
          8+
        </text>
      </svg>
    </span>
  )
}

/** Third in group but outside the eight best third-place sides. */
export function BadgeThirdOut({ title }: TitleProps) {
  return (
    <span className="standings-badge" title={title}>
      <svg
        className="standings-badge__svg standings-badge__svg--third-out"
        viewBox="0 0 34 20"
        width="34"
        height="20"
        aria-hidden="true"
      >
        <rect
          x="0.5"
          y="0.5"
          width="33"
          height="19"
          rx="5"
          fill="rgba(148, 163, 184, 0.12)"
          stroke="rgba(148, 163, 184, 0.35)"
          strokeWidth="1"
        />
        <text
          x="17"
          y="14"
          textAnchor="middle"
          fontSize="9"
          fontWeight="800"
          fill="#94a3b8"
          fontFamily="system-ui, Segoe UI, sans-serif"
        >
          Out
        </text>
      </svg>
    </span>
  )
}
