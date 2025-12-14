/**
 * Form Test Utilities
 * Helper functions to manually test form submissions from browser console
 * 
 * Usage in browser console:
 * - window.testContactForm()
 * - window.testDemoForm()
 * - window.testPricingForm()
 */

import { apiClient } from './api'
import { API_ROUTES } from '../config/apiRoutes'

/**
 * Test Contact Form Submission
 */
export const testContactForm = async (data?: {
  email?: string
  firstName?: string
  lastName?: string
  country?: string
  company?: string
  message?: string
}) => {
  const payload = {
    email: data?.email || 'test@example.com',
    firstName: data?.firstName || 'John',
    lastName: data?.lastName || 'Doe',
    country: data?.country || 'US',
    company: data?.company || 'Test Company',
    message: data?.message || 'This is a test message from manual form submission'
  }

  console.log('📝 Testing Contact Form Submission...')
  console.log('Payload:', payload)

  try {
    const response = await apiClient.post(
      API_ROUTES.FORMS.CONTACT.SUBMIT,
      payload,
      false
    )

    if (response.success) {
      console.log('✅ Contact form submitted successfully!', response)
      return { success: true, response }
    } else {
      console.error('❌ Contact form submission failed:', response)
      return { success: false, error: response.message || response.error }
    }
  } catch (error: any) {
    console.error('❌ Contact form submission error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Test Demo Form Submission
 */
export const testDemoForm = async (data?: {
  email?: string
  name?: string
  surname?: string
  village?: string
  company_name?: string
  website_url?: string
  number_of_frames?: string
  message?: string
}) => {
  const payload: Record<string, any> = {
    email: data?.email || 'demo@example.com',
    name: data?.name || 'Jane',
    surname: data?.surname || 'Smith',
    village: data?.village || 'New York',
    company_name: data?.company_name || 'Demo Company',
  }

  if (data?.website_url) payload.website_url = data.website_url
  if (data?.number_of_frames) payload.number_of_frames = data.number_of_frames
  if (data?.message) payload.message = data.message

  console.log('📝 Testing Demo Form Submission...')
  console.log('Payload:', payload)

  try {
    const response = await apiClient.post(
      API_ROUTES.FORMS.DEMO.SUBMIT,
      payload,
      false
    )

    if (response.success) {
      console.log('✅ Demo form submitted successfully!', response)
      return { success: true, response }
    } else {
      console.error('❌ Demo form submission failed:', response)
      return { success: false, error: response.message || response.error }
    }
  } catch (error: any) {
    console.error('❌ Demo form submission error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Test Pricing Form Submission
 */
export const testPricingForm = async (data?: {
  email?: string
  company?: string
  monthlyTraffic?: string
  skuCount?: string
  priority?: string
}) => {
  const payload: Record<string, any> = {
    email: data?.email || 'pricing@example.com',
    company: data?.company || 'Pricing Test Company',
    monthlyTraffic: data?.monthlyTraffic || '10000+',
    skuCount: data?.skuCount || '100-500',
    priority: data?.priority || 'medium'
  }

  console.log('📝 Testing Pricing Form Submission...')
  console.log('Payload:', payload)

  try {
    const response = await apiClient.post(
      API_ROUTES.FORMS.PRICING.SUBMIT,
      payload,
      false
    )

    if (response.success) {
      console.log('✅ Pricing form submitted successfully!', response)
      return { success: true, response }
    } else {
      console.error('❌ Pricing form submission failed:', response)
      return { success: false, error: response.message || response.error }
    }
  } catch (error: any) {
    console.error('❌ Pricing form submission error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Test Job Application Form Submission
 */
export const testJobApplicationForm = async (data?: {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  jobId?: number
}) => {
  const payload: Record<string, any> = {
    firstName: data?.firstName || 'Test',
    lastName: data?.lastName || 'Applicant',
    email: data?.email || 'applicant@example.com',
    phoneNumber: data?.phoneNumber || '+1234567890',
    jobId: data?.jobId || 1,
    whyJoinMessage: 'This is a test job application submission'
  }

  console.log('📝 Testing Job Application Form Submission...')
  console.log('Payload:', payload)

  try {
    const response = await apiClient.post(
      API_ROUTES.FORMS.JOB_APPLICATION.SUBMIT,
      payload,
      false
    )

    if (response.success) {
      console.log('✅ Job application submitted successfully!', response)
      return { success: true, response }
    } else {
      console.error('❌ Job application submission failed:', response)
      return { success: false, error: response.message || response.error }
    }
  } catch (error: any) {
    console.error('❌ Job application submission error:', error)
    return { success: false, error: error.message }
  }
}

// Make functions available in browser console for manual testing
if (typeof window !== 'undefined') {
  (window as any).testContactForm = testContactForm
  ;(window as any).testDemoForm = testDemoForm
  ;(window as any).testPricingForm = testPricingForm
  ;(window as any).testJobApplicationForm = testJobApplicationForm
  
  console.log('📋 Form test utilities loaded! Available functions:')
  console.log('  - window.testContactForm(data?)')
  console.log('  - window.testDemoForm(data?)')
  console.log('  - window.testPricingForm(data?)')
  console.log('  - window.testJobApplicationForm(data?)')
  console.log('')
  console.log('Example usage:')
  console.log('  window.testContactForm({ email: "test@example.com", firstName: "John" })')
}

