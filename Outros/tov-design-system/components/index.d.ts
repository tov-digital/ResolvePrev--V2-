// Tov — tipos dos componentes (documentação). Global: window.Tov
import * as React from "react";

export type Tone = "neutral" | "brand" | "solid" | "info" | "success" | "warning" | "danger" | "violet";
export type IconName = "dashboard" | "users" | "money" | "calendar" | "message" | "file" | "folder" | "filter" | "plus" | "close" | "check" | "chevron" | "logout" | "search";

export interface IconProps { name: IconName; size?: number; className?: string; }

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = preto Tov (padrão); brand = amarelo; secondary = branco com borda; ghost = sem fundo; danger = ação destrutiva */
  variant?: "primary" | "brand" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  icon?: IconName;
  /** Só o ícone; exige aria-label. */
  iconOnly?: boolean;
}

export interface BadgeProps {
  tone?: Tone;
  /** Ponto de status antes do texto. */
  dot?: boolean;
  /** Selo quadrado de sigla (ex.: "CR", "MBR"). */
  code?: boolean;
  children: React.ReactNode;
}

export interface AvatarProps { name: string; src?: string; size?: number; tone?: "brand" | "dark"; }

export interface CardProps { title?: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; children?: React.ReactNode; style?: React.CSSProperties; }

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; hint?: string; error?: string; }

export interface TabsProps {
  items: { value: string; label: string; icon?: IconName }[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export interface StatTileProps { label: string; value: React.ReactNode; tone?: "default" | "brand" | "success" | "danger"; }

export interface ProgressBarProps { value: number; tone?: "brand" | "ink" | "info" | "success" | "warning" | "violet"; label?: string; }

export interface ProgressRowProps {
  code: string;
  codeTone?: Tone;
  title: string;
  subtitle?: string;
  /** Use count + total (calcula a %), ou value (0–100). */
  count?: number;
  total?: number;
  value?: number;
  tone?: ProgressBarProps["tone"];
}

export interface NavItemProps { icon?: IconName; active?: boolean; href?: string; count?: number; onClick?: () => void; children: React.ReactNode; }

export interface ModalProps { title: string; onClose?: () => void; footer?: React.ReactNode; children?: React.ReactNode; /** Renderiza no fluxo (previews) em vez de fixo na tela. */ inline?: boolean; }
