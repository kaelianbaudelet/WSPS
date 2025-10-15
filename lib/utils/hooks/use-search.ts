import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import { useEffect, useMemo, useState } from "react";

export function useSearch<T>({
    queryFn,
    queryKey,
    debounceDelay = 500,
    enabled = true,
    staleTime = 1000 * 60 * 5,
}: {
    queryFn: (query: string, params?: any) => Promise<T>;
    debounceDelay?: number;
    enabled?: boolean;
    queryKey?: string;
    staleTime?: number;
}) {
    const [data, setData] = useState<T | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

    const { isLoading, refetch } = useQuery({
        queryKey: ["search", debouncedSearchQuery, queryKey],
        queryFn: async () => {
            const res = await queryFn(debouncedSearchQuery);
            setData(res);
            return res;
        },
        staleTime: staleTime,
        enabled,
    });

    const debouncedSetSearchValue = useMemo(
        () => debounce(setDebouncedSearchQuery, debounceDelay),
        [debounceDelay],
    );

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        debouncedSetSearchValue(value);
    };

    useEffect(() => {
        if (enabled) {
            refetch();
        }
    }, [debouncedSearchQuery, refetch, enabled]);

    return {
        searchQuery,
        handleSearchChange,
        data,
        isLoading,
        refetch,
    };
}
