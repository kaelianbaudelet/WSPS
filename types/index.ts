import { getAuth } from "@/app/actions/auth.actions";
export type NonNullableAuth = NonNullable<Awaited<ReturnType<typeof getAuth>>>;
