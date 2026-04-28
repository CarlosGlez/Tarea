import { type ReactNode } from "react"
import styles from "./SectionTransition.module.css"

interface Props {
  children: ReactNode
}

export const SectionTransition = ({ children }: Props) => (
  <div className={styles.wrapper}>{children}</div>
)
