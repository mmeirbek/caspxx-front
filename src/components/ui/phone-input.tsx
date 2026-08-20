import { forwardRef } from "react";
import { Input } from "@/components/ui/input";

export type PhoneInputProps = Omit<React.ComponentProps<"input">, "onChange" | "value"> & {
  value?: string;
  onChange?: (value: string) => void;
};

export function formatKzPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length >= 11) digits = digits.slice(1);
  if (digits.startsWith("7") && digits.length >= 11) digits = digits.slice(1);
  digits = digits.slice(0, 10);

  if (!digits) return "+7";
  if (digits.length <= 3) return `+7(${digits}`;
  if (digits.length <= 6) return `+7(${digits.slice(0, 3)})${digits.slice(3)}`;
  if (digits.length <= 7)
    return `+7(${digits.slice(0, 3)})${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `+7(${digits.slice(0, 3)})${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
}

export function normalizeKzPhone(display: string): string {
  const digits = display.replace(/\D/g, "").slice(-10);
  return `+7${digits}`;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => (
    <Input
      ref={ref}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      {...props}
      value={formatKzPhone(String(value ?? ""))}
      onChange={(e) => {
        onChange?.(formatKzPhone(e.target.value));
      }}
    />
  ),
);
PhoneInput.displayName = "PhoneInput";
