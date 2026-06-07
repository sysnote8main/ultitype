type CssModule = Record<string, string> | string;

function toCamelCase(className: string) {
  return className.replace(/-([a-z0-9])/g, (_, character: string) => character.toUpperCase());
}

export function normalizeCssModule<T extends Record<string, string>>(styles: T | string): T {
  if (typeof styles !== "string") {
    return styles;
  }

  return new Proxy(
    {},
    {
      get: (_target, property) => (typeof property === "string" ? property : undefined),
    },
  ) as T;
}

export function css(styles: CssModule, ...classNames: Array<string | false | null | undefined>) {
  if (typeof styles === "string") {
    return classNames
      .flatMap((className) => (className ? className.split(/\s+/) : []))
      .filter(Boolean)
      .join(" ");
  }

  const moduleStyles = normalizeCssModule(styles);

  return classNames
    .flatMap((className) => (className ? className.split(/\s+/) : []))
    .filter(Boolean)
    .map((className) => moduleStyles[toCamelCase(className)] ?? moduleStyles[className] ?? className)
    .join(" ");
}

export function cx(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}
