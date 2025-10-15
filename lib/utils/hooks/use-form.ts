import { useState } from "react";
import * as z from 'zod/v3';

interface UseFormOptions<T> {
    schema: z.ZodType<T>;
    initialValues: T;
    customValidate?: (values: T) => Partial<Record<keyof T, string>>;
}

export function useForm<T extends Record<string, any>>(options: UseFormOptions<T>) {
    const { schema, initialValues, customValidate } = options;

    const [isLoading, setIsLoading] = useState(false);
    const [inputValues, setInputValues] = useState<T>(initialValues);
    const [inputErrors, setInputErrors] = useState<Partial<Record<keyof T | "root", string>>>({});

    const handleChange = (field: keyof T, value: any) => {
        setInputValues({ ...inputValues, [field]: value });
        setInputErrors({ ...inputErrors, [field]: "" });
    };

    const setError = (field: keyof T | "root", error: string) => {
        setInputErrors({ ...inputErrors, [field]: error });
    };

    const defaultValidate = () => {
        const zodValidation = schema.safeParse(inputValues);
        const zodErrors: Partial<Record<keyof T, string>> = zodValidation.success
            ? {}
            : (zodValidation.error.flatten().fieldErrors as Partial<Record<keyof T, string>>);
        return zodErrors;
    };
    const validate = (): boolean => {
        const zodErrors = customValidate ? customValidate(inputValues) : defaultValidate();
        const errors = { ...zodErrors };
        setInputErrors(errors);

        return Object.keys(errors).length === 0;
    };

    const handleSubmit =
        (onSubmit: (values: T) => void | Promise<void>) =>
            async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                setIsLoading(true);
                if (validate()) {
                    await onSubmit(inputValues);
                    setIsLoading(false);
                }
                setIsLoading(false);
            };

    return {
        inputValues,
        inputErrors,
        handleChange,
        setError,
        handleSubmit,
        isLoading,
        setIsLoading,
        setInputValues,
    };
}
