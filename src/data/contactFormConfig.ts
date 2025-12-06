export interface FormField {
    name: string
    label: string
    type: 'text' | 'email' | 'select' | 'textarea'
    required: boolean
    placeholder?: string
    options?: string[]
    fullWidth?: boolean // If true, field spans full width in grid
}

export interface ContactDemoConfig {
    leftSection: {
        image: string
        overlayText: {
            smallText: string
            largeText: string
            buttonText: string
        }
    }
    rightSection: {
        title: string
        heading: string
        formFields: FormField[]
        submitButtonText: string
    }
}

export const defaultContactDemoConfig: ContactDemoConfig = {
    leftSection: {
        image: '/assets/images/virtual-try.jpg',
        overlayText: {
            smallText: 'Try our ultra-realistic virtual try-on',
            largeText: 'Virtual glasses try-on',
            buttonText: 'Try it now'
        }
    },
    rightSection: {
        title: 'Interested in the Fittingbox solution?',
        heading: 'Book a live demo',
        formFields: [
            {
                name: 'email',
                label: 'Email',
                type: 'email',
                required: true,
                fullWidth: true
            },
            {
                name: 'name',
                label: 'Name',
                type: 'text',
                required: true,
                fullWidth: false
            },
            {
                name: 'surname',
                label: 'Surname',
                type: 'text',
                required: true,
                fullWidth: false
            },
            {
                name: 'village',
                label: 'Village',
                type: 'select',
                required: true,
                placeholder: 'Select',
                options: ['Select', 'Option 1', 'Option 2', 'Option 3'],
                fullWidth: false
            },
            {
                name: 'companyName',
                label: 'Company Name',
                type: 'text',
                required: true,
                fullWidth: false
            },
            {
                name: 'websiteUrl',
                label: 'Website URL',
                type: 'text',
                required: false,
                fullWidth: false
            },
            {
                name: 'numberOfFrames',
                label: 'Number of frames in the catalog',
                type: 'select',
                required: false,
                placeholder: 'Select',
                options: ['Select', '1-100', '101-500', '501-1000', '1000+'],
                fullWidth: false
            },
            {
                name: 'message',
                label: 'Message',
                type: 'textarea',
                required: false,
                placeholder: 'Message',
                fullWidth: true
            }
        ],
        submitButtonText: 'Request a demo'
    }
}

