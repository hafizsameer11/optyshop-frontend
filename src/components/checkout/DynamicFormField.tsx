/**
 * Dynamic Form Field Component
 * Renders form fields based on configuration
 */

import React from 'react'
import type { FormFieldConfig } from '../../config/checkoutFormConfig'
import { formatInput } from '../../config/checkoutFormConfig'

interface DynamicFormFieldProps {
    field: FormFieldConfig
    value: string
    onChange: (name: string, value: string) => void
    error?: string
}

const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
    field,
    value,
    onChange,
    error,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        let newValue = e.target.value

        // Apply input masking if specified
        if (field.mask) {
            newValue = formatInput(newValue, field.mask)
        }

        // Apply max length validation
        if (field.validation?.maxLength && newValue.length > field.validation.maxLength) {
            newValue = newValue.slice(0, field.validation.maxLength)
        }

        onChange(field.name, newValue)
    }

    const gridColClass = field.gridCols === 2 ? 'md:col-span-2' : ''
    const baseInputClass = `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
        error ? 'border-red-500' : 'border-gray-300'
    }`

    return (
        <div className={gridColClass}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === 'select' ? (
                <select
                    name={field.name}
                    required={field.required}
                    value={value}
                    onChange={handleChange}
                    autoComplete={field.autoComplete}
                    className={baseInputClass}
                >
                    {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            ) : field.type === 'textarea' ? (
                <textarea
                    name={field.name}
                    required={field.required}
                    value={value}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    rows={4}
                    className={baseInputClass}
                />
            ) : (
                <input
                    type={field.type}
                    name={field.name}
                    required={field.required}
                    value={value}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    maxLength={field.validation?.maxLength}
                    pattern={field.validation?.pattern}
                    className={baseInputClass}
                />
            )}

            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            {field.validation?.patternMessage && !error && value && (
                <p className="mt-1 text-xs text-gray-500">{field.validation.patternMessage}</p>
            )}
        </div>
    )
}

export default DynamicFormField

