export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: "Mínimo de 8 caracteres", test: (pw) => pw.length >= 8 },
  { label: "Uma letra maiúscula", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Uma letra minúscula", test: (pw) => /[a-z]/.test(pw) },
  { label: "Um número", test: (pw) => /[0-9]/.test(pw) },
  { label: "Um caractere especial", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function isPasswordStrong(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
