"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { addDays, format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

interface DatePickerWithRangeProps {
    value?: DateRange
    onDateChange?: (range: DateRange | undefined) => void
}

export function DatePickerWithRange({ value, onDateChange }: DatePickerWithRangeProps = {}) {
    const [date, setDate] = React.useState<DateRange | undefined>(
        value ?? {
            from: new Date(new Date().getFullYear(), 0, 20),
            to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
        }
    )

    const handleSelect = (range: DateRange | undefined) => {
        setDate(range)
        onDateChange?.(range)
    }

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        id="date-picker-range"
                        className="justify-start text-[13px] font-normal inline-flex h-[40px] items-center gap-[12px] rounded-[8px] border border-[#E2E8F0] bg-white px-[16px]"
                    >
                        <CalendarIcon className="text-[#64748B]" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </>
    )
}
