import { teamFlagCode } from '../lib/teamFlagCode'

type Props = {
  name: string
  className?: string
}

export function TeamWithFlag({ name, className = '' }: Props) {
  const code = teamFlagCode(name)

  return (
    <span className={`team-flag-name ${className}`.trim()}>
      <span
        className={`fi fi-${code} fis team-flag-name__icon`}
        role="img"
        aria-label={`${name} flag`}
      />
      <span className="team-flag-name__text">{name}</span>
    </span>
  )
}
