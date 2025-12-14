/**
 * Checkout Form Configuration
 * 
 * This configuration system allows you to easily customize the checkout form:
 * - Add/remove fields
 * - Change field types (text, email, select, etc.)
 * - Modify validation rules
 * - Adjust field layout (full width vs half width)
 * - Add input masking (card numbers, phone numbers, etc.)
 * 
 * Usage:
 * 1. Modify this file to add/remove/change fields
 * 2. The form will automatically update based on the configuration
 * 3. You can also pass a custom config to the Checkout component:
 *    <Checkout formConfig={customConfig} />
 * 
 * Example: Adding a new field
 * {
 *   name: 'companyName',
 *   label: 'Company Name',
 *   type: 'text',
 *   required: false,
 *   placeholder: 'Optional',
 *   gridCols: 1,
 *   section: 'shipping',
 * }
 */

export type FieldType = 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'number' | 'password'

export interface FormFieldConfig {
    name: string
    label: string
    type: FieldType
    required: boolean
    placeholder?: string
    options?: { value: string; label: string }[] // For select fields
    validation?: {
        pattern?: string
        minLength?: number
        maxLength?: number
        patternMessage?: string
    }
    gridCols?: 1 | 2 // 1 = half width, 2 = full width (default: 1)
    section?: 'shipping' | 'payment' | 'billing' // Which section this field belongs to
    autoComplete?: string // HTML autocomplete attribute
    mask?: 'card' | 'phone' | 'expiry' | 'cvv' // Input masking
}

export interface FormSectionConfig {
    title: string
    fields: FormFieldConfig[]
}

export interface CheckoutFormConfig {
    shippingSection: FormSectionConfig
    paymentSection: FormSectionConfig
    showBillingSection?: boolean // Optional: separate billing section
    billingSection?: FormSectionConfig
}

// Default checkout form configuration
export const defaultCheckoutFormConfig: CheckoutFormConfig = {
    shippingSection: {
        title: 'Shipping Information',
        fields: [
            {
                name: 'firstName',
                label: 'First Name',
                type: 'text',
                required: true,
                placeholder: 'Enter your first name',
                gridCols: 1,
                section: 'shipping',
                autoComplete: 'given-name',
            },
            {
                name: 'lastName',
                label: 'Last Name',
                type: 'text',
                required: true,
                placeholder: 'Enter your last name',
                gridCols: 1,
                section: 'shipping',
                autoComplete: 'family-name',
            },
            {
                name: 'email',
                label: 'Email',
                type: 'email',
                required: true,
                placeholder: 'your.email@example.com',
                gridCols: 1,
                section: 'shipping',
                autoComplete: 'email',
            },
            {
                name: 'phone',
                label: 'Phone',
                type: 'tel',
                required: true,
                placeholder: '+1 (555) 123-4567',
                gridCols: 1,
                section: 'shipping',
                autoComplete: 'tel',
                mask: 'phone',
            },
            {
                name: 'address',
                label: 'Address',
                type: 'text',
                required: true,
                placeholder: '123 Main Street',
                gridCols: 2,
                section: 'shipping',
                autoComplete: 'street-address',
            },
            {
                name: 'city',
                label: 'City',
                type: 'text',
                required: true,
                placeholder: 'Enter your city',
                gridCols: 1,
                section: 'shipping',
                autoComplete: 'address-level2',
            },
            {
                name: 'zipCode',
                label: 'ZIP Code',
                type: 'text',
                required: true,
                placeholder: '12345',
                gridCols: 1,
                section: 'shipping',
                autoComplete: 'postal-code',
                validation: {
                    pattern: '^[0-9]{5}(-[0-9]{4})?$',
                    patternMessage: 'Please enter a valid ZIP code',
                },
            },
            {
                name: 'country',
                label: 'Country',
                type: 'select',
                required: true,
                gridCols: 1,
                section: 'shipping',
                autoComplete: 'country',
                options: [
                    { value: '', label: 'Select Country' },
                    { value: 'US', label: 'United States' },
                    { value: 'CA', label: 'Canada' },
                    { value: 'UK', label: 'United Kingdom' },
                    { value: 'FR', label: 'France' },
                    { value: 'DE', label: 'Germany' },
                    { value: 'IT', label: 'Italy' },
                    { value: 'ES', label: 'Spain' },
                    { value: 'AU', label: 'Australia' },
                    { value: 'JP', label: 'Japan' },
                ],
            },
        ],
    },
    paymentSection: {
        title: 'Payment Information',
        fields: [
            {
                name: 'cardNumber',
                label: 'Card Number',
                type: 'text',
                required: true,
                placeholder: '1234 5678 9012 3456',
                gridCols: 2,
                section: 'payment',
                autoComplete: 'cc-number',
                mask: 'card',
                validation: {
                    maxLength: 19,
                    pattern: '^[0-9\\s]{13,19}$',
                    patternMessage: 'Please enter a valid card number',
                },
            },
            {
                name: 'cardName',
                label: 'Cardholder Name',
                type: 'text',
                required: true,
                placeholder: 'John Doe',
                gridCols: 2,
                section: 'payment',
                autoComplete: 'cc-name',
            },
            {
                name: 'expiryDate',
                label: 'Expiry Date',
                type: 'text',
                required: true,
                placeholder: 'MM/YY',
                gridCols: 1,
                section: 'payment',
                autoComplete: 'cc-exp',
                mask: 'expiry',
                validation: {
                    maxLength: 5,
                    pattern: '^(0[1-9]|1[0-2])\\/([0-9]{2})$',
                    patternMessage: 'Please enter a valid expiry date (MM/YY)',
                },
            },
            {
                name: 'cvv',
                label: 'CVV',
                type: 'password',
                required: true,
                placeholder: '123',
                gridCols: 1,
                section: 'payment',
                autoComplete: 'cc-csc',
                mask: 'cvv',
                validation: {
                    maxLength: 4,
                    pattern: '^[0-9]{3,4}$',
                    patternMessage: 'Please enter a valid CVV',
                },
            },
        ],
    },
    showBillingSection: false, // Set to true if you want separate billing section
}

/**
 * Helper function to format input based on mask type
 */
export const formatInput = (value: string, mask?: string): string => {
    if (!mask) return value

    switch (mask) {
        case 'card':
            // Format as: 1234 5678 9012 3456
            const cardValue = value.replace(/\s/g, '')
            return cardValue.replace(/(.{4})/g, '$1 ').trim()
        case 'phone':
            // Format as: +1 (555) 123-4567
            const phoneValue = value.replace(/\D/g, '')
            if (phoneValue.length <= 3) return phoneValue
            if (phoneValue.length <= 6) return `(${phoneValue.slice(0, 3)}) ${phoneValue.slice(3)}`
            return `(${phoneValue.slice(0, 3)}) ${phoneValue.slice(3, 6)}-${phoneValue.slice(6, 10)}`
        case 'expiry':
            // Format as: MM/YY
            const expiryValue = value.replace(/\D/g, '')
            if (expiryValue.length >= 2) {
                return `${expiryValue.slice(0, 2)}/${expiryValue.slice(2, 4)}`
            }
            return expiryValue
        case 'cvv':
            // Just numbers, max 4 digits
            return value.replace(/\D/g, '').slice(0, 4)
        default:
            return value
    }
}

