import {
  interpretV5,
  contrastRatio,
  type V5Decision,
  type V5DesignTokens,
} from "./v5DesignEngine";

type ConversationMemory = {
  lastStyle?: string;
  confirmedTerms?: Record<string, string>;
};

const colours: Record<string, string> = {
  red: "#b4232d",
  "clinical red": "#b4232d",
  burgundy: "#7f1d2d",
  white: "#ffffff",
  ivory: "#fff9ed",
  cream: "#fff4df",
  black: "#171717",
  charcoal: "#25282b",
  gold: "#b8944f",
  green: "#3f735e",
  teal: "#287c7a",
  blue: "#315f85",
  navy: "#243b55",
  purple: "#7048a8",
  pink: "#d45c86",
  orange: "#d76a22",
  brown: "#76563c",
  beige: "#eadfd5",
  grey: "#70757a",
  gray: "#70757a",
};

const clean = (value: string) =>
  value
    .toLowerCase()
    .replace(/and(?=[a-z])/g, "and ")
    .replace(/[^a-z0-9#]+/g, " ")
    .trim();

function explicitColours(instruction: string) {
  const prompt = clean(instruction);
  const found = Object.entries(colours).filter(([name]) =>
    new RegExp(`\\b${name.replace(" ", "\\s+")}\\b`).test(prompt),
  );
  return [...new Map(found.map(([, value]) => [value, value])).values()];
}

function readableText(background: string) {
  return contrastRatio(background, "#171717") >=
    contrastRatio(background, "#ffffff")
    ? "#171717"
    : "#ffffff";
}

export function interpretV6(
  instruction: string,
  industry: string,
  current: V5DesignTokens,
  memory: ConversationMemory = {},
): V5Decision {
  const remembered = memory.confirmedTerms?.[clean(instruction)];
  const interpretedInstruction = remembered || instruction;
  const prompt = clean(interpretedInstruction);
  const base = interpretV5(interpretedInstruction, industry);
  const requested = explicitColours(interpretedInstruction);
  const changes: Partial<V5DesignTokens> =
    base.status === "clarify" ? {} : { ...base.changes };
  const warnings = [...base.warnings];
  const explanations: string[] =
    base.status === "clarify" ? [] : [base.detectedStyle];

  if (/keep (the )?colou?r/.test(prompt)) {
    changes.primaryColor = current.primaryColor;
    changes.secondaryColor = current.secondaryColor;
    changes.backgroundColor = current.backgroundColor;
    changes.textColor = current.textColor;
    explanations.push("your existing colours");
  } else if (requested.length) {
    const light = requested.find(
      (value) =>
        value === "#ffffff" ||
        value === "#fff9ed" ||
        value === "#fff4df" ||
        value === "#eadfd5",
    );
    const dark = requested.find(
      (value) =>
        value === "#171717" || value === "#25282b" || value === "#243b55",
    );
    const strong = requested.find((value) => value !== light && value !== dark);
    if (strong) changes.primaryColor = strong;
    if (requested.length > 1)
      changes.secondaryColor =
        requested.find((value) => value !== strong && value !== light) ||
        changes.secondaryColor;
    if (light) changes.backgroundColor = light;
    else if (/background|backdrop/.test(prompt))
      changes.backgroundColor = requested[0];
    if (dark) changes.textColor = dark;
    if (changes.backgroundColor)
      changes.textColor = dark || readableText(changes.backgroundColor);
    explanations.push(`${requested.length}-colour palette`);
  }

  if (/no (pink|red|gold|blue|green|purple|orange)/.test(prompt)) {
    const excluded = prompt.match(
      /no (pink|red|gold|blue|green|purple|orange)/,
    )?.[1];
    if (excluded && changes.primaryColor === colours[excluded])
      changes.primaryColor = current.primaryColor;
    warnings.push(`I excluded ${excluded} as requested.`);
  }
  if (/more modern|modernise|modernize/.test(prompt)) {
    changes.headingFont = "Manrope";
    changes.bodyFont = "Inter";
    changes.buttonRadius = 18;
    explanations.push("a more modern treatment");
  }
  if (/change only (the )?font|font only/.test(prompt)) {
    const fonts = {
      headingFont: changes.headingFont || "Manrope",
      bodyFont: changes.bodyFont || "Inter",
    };
    Object.keys(changes).forEach(
      (key) => delete changes[key as keyof V5DesignTokens],
    );
    Object.assign(changes, fonts);
  }
  if (/darker/.test(prompt)) {
    changes.backgroundColor = "#151719";
    changes.textColor = "#f7f3eb";
    explanations.push("a darker background");
  }
  if (/lighter/.test(prompt)) {
    changes.backgroundColor = "#fffaf3";
    changes.textColor = "#25282b";
    explanations.push("a lighter background");
  }
  if (/remove (the )?watermark|no watermark/.test(prompt))
    changes.watermark = false;
  if (/add (a )?watermark|use .*watermark/.test(prompt))
    changes.watermark = true;

  if (!Object.keys(changes).length)
    return {
      ...base,
      reply: memory.lastStyle
        ? `I remember the current direction is “${memory.lastStyle}”. Tell me which part to change: colours, typography, imagery or layout.`
        : base.reply,
    };
  if (
    changes.backgroundColor &&
    changes.textColor &&
    contrastRatio(changes.backgroundColor, changes.textColor) < 4.5
  ) {
    changes.textColor = readableText(changes.backgroundColor);
    warnings.push(
      "I corrected the text colour to maintain WCAG-readable contrast.",
    );
  }
  const detectedStyle =
    base.status === "clarify"
      ? memory.lastStyle || current.styleName
      : base.detectedStyle;
  const confidence = Math.max(base.confidence, requested.length ? 94 : 0);
  const status =
    base.status === "confirm" && !requested.length ? "confirm" : "apply";
  return {
    status,
    confidence,
    changes,
    detectedStyle,
    warnings,
    reply:
      status === "confirm"
        ? base.reply
        : `I understood ${explanations.filter(Boolean).join(" with ") || "your requested changes"} and combined the instructions.`,
  };
}
