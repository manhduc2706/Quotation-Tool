import { useState } from "react";
import IconUser from "./ui/iconUser";

interface UserInputProps {
  infrastructure: "Cloud" | "OnPremise" | null;
  fixedUserLimits?: number[] | null; // Các mốc cố định nếu chọn OnPremise
  onValueChange?: (value: number | null) => void; // Callback để truyền giá trị ra ngoài
}

export default function UserInput({
  infrastructure,
  fixedUserLimits = null,
  onValueChange,
}: UserInputProps) {
  const [value, setValue] = useState<number | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const inputValue = e.target.value;

    if (infrastructure === "Cloud") {
      const numericValue = parseInt(inputValue, 10);
      if (!isNaN(numericValue) && numericValue >= 1) {
        setValue(numericValue);
        onValueChange?.(numericValue); // Gọi callback
      } else if (inputValue === "") {
        setValue(null);
        onValueChange?.(null); // Gọi callback với giá trị null
      }
    } else if (infrastructure === "OnPremise" && fixedUserLimits) {
      const numericValue = parseInt(inputValue, 10);
      setValue(numericValue);
      onValueChange?.(numericValue); // Gọi callback
    }
  };

  const handleBlur = () => {
    if (infrastructure === "Cloud" && (value === null || value < 1)) {
      setValue(null); // Không gán giá trị mặc định
      onValueChange?.(null); // Gọi callback với giá trị null
    }
  };

  return (
    <div>
      <label
        htmlFor="user-input"
        className="flex items-center gap-2 font-medium text-gray-700 mb-4"
      >
        <IconUser />
        Số lượng user sử dụng hệ thống:
      </label>
      {infrastructure === "Cloud" ? (
        <input
          id="user-input"
          type="number"
          min={1}
          placeholder="Nhập số user"
          value={value ?? ""}
          onChange={handleChange}
          onBlur={handleBlur}
          className="border px-2 py-1 rounded w-64 mb-4"
        />
      ) : infrastructure === "OnPremise" && fixedUserLimits ? (
        <select
          id="user-input"
          value={value ?? ""}
          onChange={handleChange}
          className="border px-2 py-1 rounded w-64 mb-4"
        >
          <option value="" disabled>
            -- Chọn số lượng user --
          </option>
          {fixedUserLimits.map((limit) => (
            <option key={limit} value={limit}>
              {limit} users
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
