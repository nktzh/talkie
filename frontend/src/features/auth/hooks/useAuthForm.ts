import { useRouter } from "next/navigation";
import { useFormSubmit, type FieldErrors } from "@/shared/lib/form";

const REDIRECT_AFTER_AUTH = "/app";

interface UseAuthFormOptions<T> {
  readValues: (formData: FormData) => T;
  validate: (values: T) => FieldErrors<T>;
  submit: (values: T) => Promise<void>;
}

/** Формы входа и регистрации: после успешного запроса — переход в мессенджер */
export function useAuthForm<T>(options: UseAuthFormOptions<T>) {
  const router = useRouter();

  return useFormSubmit({
    ...options,
    onSuccess: () => router.push(REDIRECT_AFTER_AUTH),
  });
}
