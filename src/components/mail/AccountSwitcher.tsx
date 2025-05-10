"use client";

import { api } from "@/trpc/react";
import { useLocalStorage } from "usehooks-ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { getAurinkoAuthUrl } from "@/lib/aurinko";
import React, { useState } from "react";
import { toast } from "sonner";
import { getNylasAuthUrl } from "@/lib/nylas";

type Props = {
  isCollapsed: boolean;
};

const AccountSwitcher = ({ isCollapsed }: Props) => {
  const { data: accounts } = api.account.getAccounts.useQuery();
  const [accountId, setAccountId] = useLocalStorage("accountId", "");
  const [email, setEmail] = useState("");
  const { data: currentEmailData, isLoading: currentEmailDataLoading } =
    api.account.getCurrentUserEmail.useQuery(
      {
        email,
        accountId,
      },
      {
        enabled: !!accountId && !!email,
      },
    );
  const [userCurrentEmail, setUserCurrentEmail] = useLocalStorage(
    "userCurrentEmail",
    {
      emailAddress: currentEmailData?.email,
      name: currentEmailData?.name,
      id: currentEmailData?.id,
    },
  );
  React.useEffect(() => {
    if (accounts && accounts.length > 0) {
      if (accountId) return;
      setAccountId(accounts[0]!.id);
      setEmail(accounts[0]?.emailAddress!);
    } else if (accounts && accounts.length === 0) {
      toast("Link an account to continue", {
        action: {
          label: "Add account",
          onClick: async () => {
            try {
              const url = await getNylasAuthUrl("Google");
              window.location.href = url;
            } catch (error) {
              toast.error((error as Error).message);
            }
          },
        },
      });
    }
  }, [accounts]);

  React.useEffect(() => {
    if (currentEmailData) {
      setUserCurrentEmail({
        emailAddress: currentEmailData?.email,
        name: currentEmailData?.name,
        id: currentEmailData?.id,
      });
    }
  }, [currentEmailData]);

  if (!accounts) return;

  function setAccount(id: string) {
    setAccountId(id);
    let acc = accounts?.find((email) => id == email.id);
    setEmail(acc?.emailAddress!);
  }

  return (
    <Select defaultValue={accountId} onValueChange={setAccount}>
      <SelectTrigger
        className={cn(
          "flex w-full flex-1 items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
          isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden",
        )}
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an account">
          <span className={cn({ hidden: !isCollapsed })}>
            {accounts!
              .find((account) => account.id === accountId)
              ?.emailAddress[0]?.toUpperCase()}
          </span>
          <span className={cn("ml-2", isCollapsed && "hidden")}>
            {
              accounts!.find((account) => account.id === accountId)
                ?.emailAddress
            }
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts!.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
              {account.emailAddress}
            </div>
          </SelectItem>
        ))}

        <div
          onClick={async (e) => {
            try {
              const url = await getAurinkoAuthUrl("Google");
              window.location.href = url;
            } catch (error) {
              //   toast.error((error as Error).message)
            }
          }}
          className="relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-gray-50 focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        >
          <Plus className="mr-1 size-4" />
          Add account
        </div>
      </SelectContent>
    </Select>
  );
};

export default AccountSwitcher;
