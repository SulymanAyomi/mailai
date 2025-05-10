import React, { useState } from "react";
import Avatar from "react-avatar";
import Select from "react-select";
import { useAutoAnimate } from "@formkit/auto-animate/react";

type TagInputProps = {
  suggestions:
    | {
        name: string;
        email: string;
      }[]
    | [];
  defaultValues?: {
    label: string;
    value: {
      name: string;
      email: string;
    };
  }[];
  placeholder: string;
  label: string;

  onChange: (
    values: {
      label: string;
      value: {
        name: string;
        email: string;
      };
    }[],
  ) => void;
  value: {
    label: string;
    value: {
      name: string;
      email: string;
    };
  }[];
  setExpanded?: () => void;
  expanded?: boolean;
};

const TagInput: React.FC<TagInputProps> = ({
  suggestions,
  defaultValues = [],
  label,
  onChange,
  value,
  setExpanded,
  expanded,
}) => {
  const [ref] = useAutoAnimate();
  const [input, setInput] = useState("");

  const options = suggestions.map((suggestion) => ({
    label: (
      <span
        className="flex items-center gap-2 dark:text-black"
        key={suggestion.email}
      >
        <Avatar
          name={suggestion.name}
          size="25"
          textSizeRatio={2}
          round={true}
        />
        {suggestion.name}
      </span>
    ),
    value: { ...suggestion },
  }));

  return (
    <div className="flex items-center border-b" ref={ref}>
      <span className="ml-3 text-sm text-gray-500">{label}</span>
      <Select
        value={value}
        // @ts-ignore
        onChange={onChange}
        defaultValues={defaultValues}
        className="w-full flex-1"
        isMulti
        onInputChange={setInput}
        placeholder={""}
        // @ts-ignore
        options={
          input
            ? options.concat({
                // @ts-ignore
                label: (
                  <span className="flex items-center gap-2">
                    <Avatar
                      name={input}
                      size="25"
                      textSizeRatio={2}
                      round={true}
                    />
                    {input}
                  </span>
                ),
                value: {
                  name: "",
                  email: input,
                },
              })
            : options
        }
        classNames={{
          control: () => {
            return "!border-none !outline-none !ring-0 !shadow-none focus:border-none focus:outline-none focus:ring-0 focus:shadow-none dark:bg-transparent";
          },
          multiValue: () => {
            return "dark:!bg-gray-700";
          },
          multiValueLabel: () => {
            return "dark:text-white dark:bg-gray-700 rounded-md";
          },
        }}
        classNamePrefix="select"
      />
      {label == "To" && !expanded && (
        <span
          className="cursor-pointer p-1 hover:bg-muted"
          onClick={setExpanded}
        >
          CC
        </span>
      )}
    </div>
  );
};

export default TagInput;
