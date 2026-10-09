import type { FC, ReactNode } from 'react';

/**
 * Conjunto de ícones SVG (traço, no estilo lucide) para os serviços.
 * Cada serviço guarda uma chave (`services.icon`) e o render resolve aqui.
 * Falta/desconhecido → ícone padrão (magia).
 */

export type ServiceIconKey =
  | 'camiseta'
  | 'calca'
  | 'bermuda'
  | 'moletom'
  | 'vestido'
  | 'lavagem'
  | 'tapete'
  | 'edredom'
  | 'couro'
  | 'tenis'
  | 'mochila'
  | 'pelucia'
  | 'default';

interface IconProps {
  className?: string;
}

function makeIcon(children: ReactNode): FC<IconProps> {
  return function Icon({ className }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {children}
      </svg>
    );
  };
}

// ------------- Ícones de peças de roupa -------------

const camisetaIcon = makeIcon(
  <path d="M8.5 4.5 4.5 7.5 6.5 10.5 8.5 9.5v10h7v-10l2 1 2-3-4-3c-1.2 1.3-3.8 1.3-5 0Z" />
);

const calcaIcon = makeIcon(
  <>
    <path d="M5.5 5h13v2.5l-1.5 11.5h-4l-1-8h-2l-1 8H7L5.5 7.5V5Z" />
    <path d="M12 5v6" />
  </>
);

const bermudaIcon = makeIcon(
  <path d="M5.5 5h13v2l-1.5 6.5-3.5 1-1-6h-2l-1 6-3.5-1L5.5 7V5Z" />
);

const moletomIcon = makeIcon(
  <>
    <path d="M8 8 6 5.5 9 4c1-.5 5-.5 6 0l3 1.5L16 8v11H8V8Z" />
    <path d="M9.5 4.5C9.5 2.5 14.5 2.5 14.5 4.5" />
    <path d="M9.5 12h5l1 3h-7Z" />
  </>
);

const vestidoIcon = makeIcon(
  <>
    <path d="M9 4.5c0 1.5-1.5 2-2.5 3.5 1 .8 1.5 1.8 1.5 3v9h8v-9c0-1.2.5-2.2 1.5-3-1-1.5-2.5-2-2.5-3.5C14 6 10 6 9 4.5Z" />
    <path d="M9.5 11.5h5" />
  </>
);

// ------------- Serviços / objetos -------------

const lavagemIcon = makeIcon(
  <>
    <path d="M7 6c0-2.2 10-2.2 10 0" />
    <path d="M7 6h10l-1.6 12.5c-.2 1.1-.9 1.5-2 1.5h-2.8c-1.1 0-1.8-.4-2-1.5L7 6Z" />
    <path d="M9.5 12c1.2-.9 3.8-.9 5 0M9.5 15c1.2-.9 3.8-.9 5 0" />
  </>
);

const tapeteIcon = makeIcon(
  <>
    <rect x="5" y="9.5" width="14" height="6.5" rx="1" />
    <path d="M8 9.5V7M11 9.5V7M13 9.5V7M16 9.5V7" />
    <path d="M8 16v2.5M11 16v2.5M13 16v2.5M16 16v2.5" />
  </>
);

const edredomIcon = makeIcon(
  <>
    <path d="M5.5 11h13v8.5h-13Z" />
    <path d="M5.5 14.5h13" />
    <path d="M9.5 11V7.5h5V11" />
  </>
);

const couroIcon = makeIcon(
  <>
    <path d="M9 4.5 5 7.5l2.2 3 1.8-1v9.5h6V9.5l1.8 1 2.2-3-4-3c-1.2 1.1-3.8 1.1-5 0Z" />
    <path d="M10 4.5l-.8 2M14 4.5l.8 2" />
    <path d="M10.5 12.5h3" />
  </>
);

const tenisIcon = makeIcon(
  <>
    <path d="M4 16.5c0-3 2.5-4.5 6-4.5h4.5l2.5-3 3 .4-2.4 3.3c1.5.9 2.4 2.2 2.4 3.8" />
    <path d="M4 16.5h17v1.5c0 .8-.3 1.5-1.2 1.5H5.2c-.9 0-1.2-.7-1.2-1.5Z" />
  </>
);

const mochilaIcon = makeIcon(
  <>
    <rect x="7" y="7" width="10" height="12.5" rx="2.5" />
    <path d="M9.5 7V5.5c0-1 5-1 5 0V7" />
    <path d="M7 12.5h10" />
    <path d="M9.5 12.5v5M14.5 12.5v5" />
  </>
);

const peluciaIcon = makeIcon(
  <>
    <circle cx="12" cy="10" r="4.4" />
    <circle cx="7.8" cy="7.4" r="1.8" />
    <circle cx="16.2" cy="7.4" r="1.8" />
    <path d="M8.8 14.6c0 3.4 6.4 3.4 6.4 0z" />
    <path d="M6.6 16.4c-1.8 1-1.6 2.6 0 3.4" />
    <path d="M17.4 16.4c1.8 1 1.6 2.6 0 3.4" />
  </>
);

const defaultIcon = makeIcon(
  <path d="M12 3.5 14 10l6.5 2-6.5 2-2 6.5L10 14l-6.5-2L10 10l2-6.5Z" />
);

// ------------- Registro -------------

export interface ServiceIconOption {
  key: ServiceIconKey;
  label: string;
  Component: FC<IconProps>;
}

export const SERVICE_ICONS: Record<ServiceIconKey, ServiceIconOption> = {
  camiseta: { key: 'camiseta', label: 'Camiseta', Component: camisetaIcon },
  calca: { key: 'calca', label: 'Calça', Component: calcaIcon },
  bermuda: { key: 'bermuda', label: 'Bermuda', Component: bermudaIcon },
  moletom: { key: 'moletom', label: 'Moletom', Component: moletomIcon },
  vestido: { key: 'vestido', label: 'Vestido', Component: vestidoIcon },
  lavagem: { key: 'lavagem', label: 'Lavagem', Component: lavagemIcon },
  tapete: { key: 'tapete', label: 'Tapete', Component: tapeteIcon },
  edredom: { key: 'edredom', label: 'Edredom', Component: edredomIcon },
  couro: { key: 'couro', label: 'Couro', Component: couroIcon },
  tenis: { key: 'tenis', label: 'Tênis', Component: tenisIcon },
  mochila: { key: 'mochila', label: 'Mochila', Component: mochilaIcon },
  pelucia: { key: 'pelucia', label: 'Pelúcia', Component: peluciaIcon },
  default: { key: 'default', label: 'Padrão', Component: defaultIcon },
};

export const SERVICE_ICON_OPTIONS = Object.values(SERVICE_ICONS);

export function isServiceIconKey(icon?: string | null): icon is ServiceIconKey {
  return !!icon && icon in SERVICE_ICONS;
}

/** Ícone de um serviço, com fallback seguro para o padrão. */
export function ServiceIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const key = isServiceIconKey(icon) ? icon : 'default';
  const { Component } = SERVICE_ICONS[key];
  return <Component className={className} />;
}

/**
 * Sugere o ícone a partir do nome (palavras-chave, sem acentos).
 * Ordem importa: mais específicos primeiro (tênis/edredom antes de lavagem).
 */
export function guessServiceIcon(name: string): ServiceIconKey {
  const n = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const rules: Array<[string, ServiceIconKey]> = [
    ['bermuda', 'bermuda'],
    ['calca', 'calca'],
    ['camiseta', 'camiseta'],
    ['camisa', 'camiseta'],
    ['moletom', 'moletom'],
    ['vestido', 'vestido'],
    ['edredom', 'edredom'],
    ['cobertor', 'edredom'],
    ['tapete', 'tapete'],
    ['couro', 'couro'],
    ['tenis', 'tenis'],
    ['sapato', 'tenis'],
    ['mochila', 'mochila'],
    ['bolsa', 'mochila'],
    ['pelucia', 'pelucia'],
    ['ursinho', 'pelucia'],
    ['brinquedo', 'pelucia'],
    ['lavagem', 'lavagem'],
    ['roupa', 'lavagem'],
    ['higieniza', 'lavagem'],
  ];
  for (const [keyword, icon] of rules) {
    if (n.includes(keyword)) return icon;
  }
  return 'default';
}

// re-export do tipo para consumo externo
export type { IconProps };