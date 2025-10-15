"use client";
import { Card } from "@/components/ui/card";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { CheckIcon, Loader, MinusIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ThemeSelectors() {
    const { setTheme, theme } = useTheme();
    const [loadedTheme, setLoadedTheme] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (theme) {
            setLoadedTheme(theme);
            setIsLoading(false);
        }
    }, [theme]);

    const items = [
        {
            value: "light",
            label: "Thème Clair",
            image: "/images/designs/light-mode.png",
        },
        {
            value: "dark",
            label: "Thème Sombre",
            image: "/images/designs/dark-mode.png",
        },
        {
            value: "system",
            label: "Thème du Système",
            image: "/images/designs/system-mode.png",
        },
    ];

    return (
        <Card>
            <Card.Header>
                <Card.Title>Choisissez votre thème</Card.Title>
                <Card.Description>
                    Sélectionnez entre le mode clair, sombre ou suivez la préférence du système.
                </Card.Description>
            </Card.Header>

            <Card.Content>
                {isLoading ? (
                    <div className="grid place-content-center p-10">
                        <Loader className="animate-spin" />
                    </div>
                ) : (
                    <RadioGroup
                        name="theme"
                        value={loadedTheme}
                        onChange={setTheme}
                        className="grid grid-cols-2 md:grid-cols-3 gap-6"
                    >
                        {items.map((item) => (
                            <Radio
                                key={item.value}
                                value={item.value}
                                className="group block
                            [&>div.grid]:grid-cols-1
                            [&>div.grid]:gap-x-0
                            [&_[data-slot=indicator]]:hidden"
                            >
                                {({ isSelected }) => (
                                    <div className="relative cursor-pointer">
                                        <Image
                                            src={item.image}
                                            alt={item.label}
                                            width={200}
                                            height={150}
                                            className={`border relative overflow-hidden rounded-md shadow-xs transition 
                          outline-none group-aria-disabled:opacity-50
                          ${isSelected ? "border-ring bg-accent" : "border-input"}
                        `}
                                        />
                                        <div className="mt-2 flex items-center gap-1">
                                            {isSelected || item.value === loadedTheme ? (
                                                <CheckIcon size={16} aria-hidden="true" />
                                            ) : (
                                                <MinusIcon size={16} aria-hidden="true" />
                                            )}
                                            <span className="text-xs font-medium">
                                                {item.label}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </Radio>
                        ))}
                    </RadioGroup>
                )}
            </Card.Content>
        </Card>
    );
}
