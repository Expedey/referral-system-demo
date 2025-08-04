interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  className = "",
  ...props
}) => {
  return (
    <div>
      <label
        htmlFor={props.id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        {label}
      </label>
      <div className="mt-1">
        <select
          {...props}
          className={`
            block w-full px-3 py-2 bg-white dark:bg-gray-700
            border rounded-md shadow-sm
            text-sm
            ${error
              ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500"
            }
            disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none
            ${className}
          `}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {(error || helperText) && (
        <p
          className={`mt-2 text-sm ${
            error ? "text-red-600" : "text-gray-500"
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Select; 