import { useState, useTransition, type FormEvent } from "react";
import { hasErrors, type FieldErrors } from "./utils";

const DEFAULT_ERROR_MESSAGE = "Не удалось выполнить запрос. Попробуйте ещё раз.";

export type FormStatus = "idle" | "success";

interface UseFormSubmitOptions<T> {
  readValues: (formData: FormData) => T;
  validate: (values: T) => FieldErrors<T>;
  submit: (values: T) => Promise<void>;
  /** Вызывается внутри transition: isPending остаётся true, пока идёт, например, навигация */
  onSuccess?: (values: T, form: HTMLFormElement) => void;
}

/**
 * Общий сценарий отправки формы: чтение значений → валидация → запрос.
 * Первое невалидное поле получает фокус, ошибка запроса возвращается в formError.
 */
export function useFormSubmit<T>({ readValues, validate, submit, onSuccess }: UseFormSubmitOptions<T>) {
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const values = readValues(new FormData(form));
    const nextErrors = validate(values);

    setErrors(nextErrors);
    setFormError(null);
    setStatus("idle");

    if (hasErrors(nextErrors)) {
      const firstInvalidField = Object.entries(nextErrors).find(([, message]) => message)?.[0];
      const field = firstInvalidField ? form.elements.namedItem(firstInvalidField) : null;
      if (field instanceof HTMLElement) field.focus();
      return;
    }

    startTransition(async () => {
      try {
        await submit(values);
        setStatus("success");
        onSuccess?.(values, form);
      } catch (error) {
        setFormError(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE);
      }
    });
  }

  function clearFieldError(field: keyof T) {
    setStatus("idle");
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  return { errors, formError, status, isPending, handleSubmit, clearFieldError };
}
