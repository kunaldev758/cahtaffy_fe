"use client";

import { useEffect, useState } from "react";
import TopHead from "../_components/TopHead";
import { Button } from "@/components/ui/button";
import EmailField from "./_components/EmailField";
import PhoneField from "./_components/PhoneField";
import {
  Country,
  getCountries,
  getCountryCallingCode,
  Value,
} from "react-phone-number-input";
import { SaveIcon } from "lucide-react";
import {
  getChatTranscriptSettings,
  updateChatTranscriptSettings,
} from "@/app/_api/dashboard/action";
import { toast } from "react-toastify";

function ChatTranscriptsPage() {
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [allTranscriptEmails, setAllTranscriptEmails] = useState<string[]>([]);
  const [salesLeadEmails, setSalesLeadEmails] = useState<string[]>([]);
  const [supportTicketEmails, setSupportTicketEmails] = useState<string[]>([]);

  const [allTranscriptInput, setAllTranscriptInput] = useState("");
  const [salesLeadInput, setSalesLeadInput] = useState("");
  const [supportTicketInput, setSupportTicketInput] = useState("");

  const [salesPhone, setSalesPhone] = useState<string>("");
  const [supportPhone, setSupportPhone] = useState<string>("");

  const [salesPhoneCountryCode, setSalesPhoneCountryCode] =
    useState<string>(localStorage.getItem("userCountry") as string || "IN");
  const [supportPhoneCountryCode, setSupportPhoneCountryCode] =
    useState<string>(localStorage.getItem("userCountry") as string || "IN");

  const getCountryByCallingCode = (
    callingCode: string,
  ): Country | undefined => {
    return getCountries().find(
      (country) => getCountryCallingCode(country) === callingCode,
    );
  };

  const addTags = (
    rawValue: string,
    tags: string[],
    setTags: (nextTags: string[]) => void,
  ) => {
    const candidates = rawValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!candidates.length) return;

    const existing = new Set(tags.map((item) => item.toLowerCase()));
    const nextTags = [...tags];

    candidates.forEach((candidate) => {
      const normalized = candidate.toLowerCase();
      if (!existing.has(normalized)) {
        nextTags.push(candidate);
        existing.add(normalized);
      }
    });

    setTags(nextTags);
  };

  const removeTag = (
    tag: string,
    tags: string[],
    setTags: (nextTags: string[]) => void,
  ) => {
    setTags(tags.filter((item) => item !== tag));
  };

  const handleTagInputChange = (
    value: string,
    tags: string[],
    setTags: (nextTags: string[]) => void,
    setInput: (next: string) => void,
  ) => {
    if (!value.includes(",")) {
      setInput(value);
      return;
    }

    const parts = value.split(",");
    const pendingInput = parts.pop()?.trim() ?? "";
    const tagChunk = parts.join(",");

    addTags(tagChunk, tags, setTags);
    setInput(pendingInput);
  };

  const handleTagKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    tags: string[],
    setTags: (nextTags: string[]) => void,
    input: string,
    setInput: (next: string) => void,
  ) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTags(input, tags, setTags);
      setInput("");
      return;
    }

    if (event.key === "Backspace" && !input.trim() && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleTagBlur = (
    tags: string[],
    setTags: (nextTags: string[]) => void,
    input: string,
    setInput: (next: string) => void,
  ) => {
    addTags(input, tags, setTags);
    setInput("");
  };

  const handleSaveChanges = async () => {
    setUpdateLoading(true);
    const response = await updateChatTranscriptSettings({
      transcriptEmails:allTranscriptEmails,
      salesLeadEmails,
      supportTicketEmails,
      salesLeadPhone:
        "+" +
        getCountryCallingCode(salesPhoneCountryCode as Country) +
        " " +
        salesPhone,
      supportTicketPhone:
        "+" +
        getCountryCallingCode(supportPhoneCountryCode as Country) +
        " " +
        supportPhone,
    });
    if (response?.status_code === 200) {
      toast.success("Chat transcript settings updated successfully");
    } else if (response?.status_code === 400) {
      toast.error(response.data.message || response.data.error);
    } else {
      toast.error(
        response?.message || response?.error || "Failed to update chat transcript settings",
      );
    }
    setUpdateLoading(false);
  };

  useEffect(() => {
    const fetchChatTranscriptSettings = async () => {
      const response = await getChatTranscriptSettings();
      if (response?.status_code === 200 && response.data) {
        setAllTranscriptEmails(response.data.transcriptEmails);
        setSalesLeadEmails(response.data.salesLeadEmails);
        setSupportTicketEmails(response.data.supportTicketEmails || []);
        setSalesPhone(response.data.salesLeadPhone.split(" ")[1]);
        setSupportPhone(response.data.supportTicketPhone.split(" ")[1]);
        if (response.data.salesLeadPhone) {
          setSalesPhoneCountryCode(
            getCountryByCallingCode(
              response.data.salesLeadPhone.split(" ")[0].replace("+", ""),
            ) as Country,
          );
        }
        if (response.data.supportTicketPhone) {
          setSupportPhoneCountryCode(
            getCountryByCallingCode(
              response.data.supportTicketPhone.split(" ")[0].replace("+", ""),
            ) as Country,
          );
        }
      }
    };
    fetchChatTranscriptSettings();
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#111827]">
      <TopHead
        title="Chat Transcripts"
        subtitle="View and manage your chat transcripts."
        showDatePicker={false}
        showWebsiteSelect={false}
        showNotificationBell={false}
        showStatusBadge={false}
      />

      <div className="rounded-tl-[30px] bg-[#F3F4F6] px-4 pb-10 pt-6 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[16px] bg-white p-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-[2px] w-8 bg-[#E5E7EB]" />
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#000000]">
              Chat Transcript Delivery/ Notifications
            </h2>
            <div className="h-[2px] flex-1 bg-[#E5E7EB]" />
          </div>

          <div className="space-y-4">
            <EmailField
              label="All Chat Transcript Email Addresses"
              tags={allTranscriptEmails}
              inputValue={allTranscriptInput}
              onInputChange={(value) =>
                handleTagInputChange(
                  value,
                  allTranscriptEmails,
                  setAllTranscriptEmails,
                  setAllTranscriptInput,
                )
              }
              onKeyDown={(event) =>
                handleTagKeyDown(
                  event,
                  allTranscriptEmails,
                  setAllTranscriptEmails,
                  allTranscriptInput,
                  setAllTranscriptInput,
                )
              }
              onRemoveTag={(tag) =>
                removeTag(tag, allTranscriptEmails, setAllTranscriptEmails)
              }
              onBlur={() =>
                handleTagBlur(
                  allTranscriptEmails,
                  setAllTranscriptEmails,
                  allTranscriptInput,
                  setAllTranscriptInput,
                )
              }
            />
            <EmailField
              label="Sales Leads Email Addresses"
              tags={salesLeadEmails}
              inputValue={salesLeadInput}
              onInputChange={(value) =>
                handleTagInputChange(
                  value,
                  salesLeadEmails,
                  setSalesLeadEmails,
                  setSalesLeadInput,
                )
              }
              onKeyDown={(event) =>
                handleTagKeyDown(
                  event,
                  salesLeadEmails,
                  setSalesLeadEmails,
                  salesLeadInput,
                  setSalesLeadInput,
                )
              }
              onRemoveTag={(tag) =>
                removeTag(tag, salesLeadEmails, setSalesLeadEmails)
              }
              onBlur={() =>
                handleTagBlur(
                  salesLeadEmails,
                  setSalesLeadEmails,
                  salesLeadInput,
                  setSalesLeadInput,
                )
              }
            />
            <EmailField
              label="Support Tickets Email Addresses"
              tags={supportTicketEmails}
              inputValue={supportTicketInput}
              onInputChange={(value) =>
                handleTagInputChange(
                  value,
                  supportTicketEmails,
                  setSupportTicketEmails,
                  setSupportTicketInput,
                )
              }
              onKeyDown={(event) =>
                handleTagKeyDown(
                  event,
                  supportTicketEmails,
                  setSupportTicketEmails,
                  supportTicketInput,
                  setSupportTicketInput,
                )
              }
              onRemoveTag={(tag) =>
                removeTag(tag, supportTicketEmails, setSupportTicketEmails)
              }
              onBlur={() =>
                handleTagBlur(
                  supportTicketEmails,
                  setSupportTicketEmails,
                  supportTicketInput,
                  setSupportTicketInput,
                )
              }
            />

            <div className="grid gap-4 md:grid-cols-2">
              <PhoneField
                label="Sales Leads Phone Number"
                value={salesPhone}
                onChange={(nextValue: string) => setSalesPhone(nextValue)}
                countryCode={salesPhoneCountryCode}
                onChangeCountryCode={setSalesPhoneCountryCode}
              />
              <PhoneField
                label="Support Ticket Phone Number"
                value={supportPhone}
                onChange={(nextValue: string) => setSupportPhone(nextValue)}
                countryCode={supportPhoneCountryCode}
                onChangeCountryCode={setSupportPhoneCountryCode}
              />
            </div>
          </div>
          <Button
            variant="default"
            className="mt-4 text-white bg-[#111827] hover:bg-[#1f2937] flex items-center gap-2"
            onClick={handleSaveChanges}
            disabled={updateLoading}
          >
            <SaveIcon className="w-4 h-4" />
            <span>{updateLoading ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChatTranscriptsPage;
