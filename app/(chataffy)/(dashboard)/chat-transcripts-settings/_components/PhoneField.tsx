import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";
import PhoneInput from "react-phone-number-input";
import type { Country, Value } from "react-phone-number-input";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumber,
} from "react-phone-number-input";
import en from "react-phone-number-input/locale/en";
import "react-phone-number-input/style.css";

type PhoneFieldProps = {
  label: string;
  value: string; // just the national number e.g. "9876543210"
  onChange: (nationalNumber: string) => void;
  countryCode: string;
  onChangeCountryCode: (nextCountryCode: string) => void;
};

function CountrySelect({
  value,
  onChange,
}: {
  value: Country;
  onChange: (country: Country) => void;
}) {
  // Convert country code (e.g. IN) to flag emoji
  const getFlagEmoji = (countryCode: string) =>
    countryCode
      .toUpperCase()
      .split("")
      .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
      .join("");

  return (
    <div className="relative flex-shrink-0">
      {/* Visible overlay — shows only the flag */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 rounded-lg">
        <span className="text-xl leading-none">{getFlagEmoji(value)}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>

      {/* Actual select — invisible but fully functional */}
      <Select
        value={value}
        onValueChange={(value) => onChange(value as Country)}
      >
        <SelectTrigger className="opacity-0 h-full w-full absolute inset-0 cursor-pointer">
          <SelectValue placeholder="Select country" />
        </SelectTrigger>
        <SelectContent>
          {getCountries().map((country) => (
            <SelectItem key={country} value={country}>
              {getFlagEmoji(country)} {en[country]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sized container so the overlay has dimensions */}
      <div className="h-[46px] w-[64px] rounded-lg border border-gray-200 bg-gray-50" />
    </div>
  );
}

export default function PhoneField({
  label,
  value,
  onChange,
  countryCode,
  onChangeCountryCode,
}: PhoneFieldProps) {
  const callingCode = getCountryCallingCode(countryCode as Country);

  const handleChange = (fullValue: Value) => {
    if (!fullValue) {
      onChange("");
      return;
    }
    try {
      // Parse the full E.164 number and extract only the national number
      const parsed = parsePhoneNumber(fullValue);
      onChange(parsed?.nationalNumber ?? "");
    } catch {
      onChange("");
    }
  };

  return (
    <div className="flex flex-col gap-2 font-sans">
      <label>{label}</label>

      <div className="flex gap-2 items-stretch">
        {/* Country Selector */}
        <CountrySelect
          value={countryCode as Country}
          onChange={(country) => {
            onChangeCountryCode(country);
            onChange(""); // reset number when country changes
          }}
        />

        {/* Phone Number Box */}
        <div
          className={`flex flex-1 items-center gap-2 px-3.5 min-h-[46px] rounded-lg border transition-all duration-150
            `}
        >
          {/* Calling Code Badge — not editable */}
          <span className="flex-shrink-0 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600 font-mono select-none">
            +{callingCode}
          </span>

          <div className="h-4 w-px flex-shrink-0 bg-gray-200" />

          {/* Plain input — no PhoneInput wrapper needed */}
          <input
            type="tel"
            value={value}
            placeholder="Phone number"
            onChange={(e) => {
              // Allow only digits
              const digits = e.target.value.replace(/\D/g, "");
              // digits length should be less than 12
              if (digits.length > 12) {
                return;
              }
              onChange(digits);
            }}
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 font-mono tracking-wide min-w-0"
          />
        </div>
      </div>
    </div>
  );
}
