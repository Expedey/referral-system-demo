import React from "react";
import { clsx } from "clsx";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyles =
    "block w-full rounded-lg border-gray-300 dark:border-gray-300 shadow-sm transition-colors duration-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-gray-100 dark:disabled:text-gray-600 bg-white text-gray-900 dark:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 px-4 py-3 text-base";
  const errorStyles = "border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:border-red-400 dark:focus:ring-red-400";
  const iconStyles = leftIcon ? "pl-12" : rightIcon ? "pr-12" : "";

  const inputClasses = clsx(
    baseStyles,
    error && errorStyles,
    iconStyles,
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400 dark:text-gray-500">{leftIcon}</div>
          </div>
        )}

        <input id={inputId} className={inputClasses} {...props} />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400 dark:text-gray-500">{rightIcon}</div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
