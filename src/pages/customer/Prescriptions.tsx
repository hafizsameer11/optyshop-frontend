import React, { useEffect, useState } from 'react'
import { 
  getPrescriptions, 
  createPrescription, 
  updatePrescription, 
  deletePrescription
} from '../../services/prescriptionsService'
import type { Prescription, PrescriptionData } from '../../services/prescriptionsService'

const Prescriptions: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState<PrescriptionData>({
    prescription_type: 'single_vision',
    od_sphere: '',
    od_cylinder: '',
    od_axis: undefined,
    od_add: null,
    os_sphere: '',
    os_cylinder: '',
    os_axis: undefined,
    os_add: null,
    pd_binocular: '',
    pd_monocular_od: '',
    pd_monocular_os: '',
    pd_near: null,
    ph_od: null,
    ph_os: null,
    doctor_name: null,
    doctor_license: null,
    prescription_date: null,
    expiry_date: null,
    notes: null
  })

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const data = await getPrescriptions()
      setPrescriptions(data)
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
      setMessage({ type: 'error', text: 'Failed to load prescriptions' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      prescription_type: 'single_vision',
      od_sphere: '',
      od_cylinder: '',
      od_axis: undefined,
      od_add: null,
      os_sphere: '',
      os_cylinder: '',
      os_axis: undefined,
      os_add: null,
      pd_binocular: '',
      pd_monocular_od: '',
      pd_monocular_os: '',
      pd_near: null,
      ph_od: null,
      ph_os: null,
      doctor_name: null,
      doctor_license: null,
      prescription_date: null,
      expiry_date: null,
      notes: null
    })
    setEditingId(null)
  }

  const handleEdit = (prescription: Prescription) => {
    setFormData({
      prescription_type: prescription.prescription_type || 'single_vision',
      od_sphere: prescription.od_sphere?.toString() || '',
      od_cylinder: prescription.od_cylinder?.toString() || '',
      od_axis: prescription.od_axis,
      od_add: prescription.od_add,
      os_sphere: prescription.os_sphere?.toString() || '',
      os_cylinder: prescription.os_cylinder?.toString() || '',
      os_axis: prescription.os_axis,
      os_add: prescription.os_add,
      pd_binocular: prescription.pd_binocular?.toString() || '',
      pd_monocular_od: prescription.pd_monocular_od?.toString() || '',
      pd_monocular_os: prescription.pd_monocular_os?.toString() || '',
      pd_near: prescription.pd_near,
      ph_od: prescription.ph_od,
      ph_os: prescription.ph_os,
      doctor_name: prescription.doctor_name,
      doctor_license: prescription.doctor_license,
      prescription_date: prescription.prescription_date,
      expiry_date: prescription.expiry_date,
      notes: prescription.notes
    })
    setEditingId(prescription.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    
    try {
      const payload: PrescriptionData = {
        prescription_type: formData.prescription_type
      }
      
      // Build payload with proper type conversions
      if (formData.od_sphere) payload.od_sphere = formData.od_sphere
      if (formData.od_cylinder) payload.od_cylinder = formData.od_cylinder
      if (formData.od_axis !== undefined) payload.od_axis = typeof formData.od_axis === 'string' ? parseInt(formData.od_axis) : formData.od_axis
      if (formData.od_add !== null && formData.od_add !== '') payload.od_add = formData.od_add
      
      if (formData.os_sphere) payload.os_sphere = formData.os_sphere
      if (formData.os_cylinder) payload.os_cylinder = formData.os_cylinder
      if (formData.os_axis !== undefined) payload.os_axis = typeof formData.os_axis === 'string' ? parseInt(formData.os_axis) : formData.os_axis
      if (formData.os_add !== null && formData.os_add !== '') payload.os_add = formData.os_add
      
      if (formData.pd_binocular) payload.pd_binocular = formData.pd_binocular
      if (formData.pd_monocular_od) payload.pd_monocular_od = formData.pd_monocular_od
      if (formData.pd_monocular_os) payload.pd_monocular_os = formData.pd_monocular_os
      if (formData.pd_near !== null && formData.pd_near !== '') payload.pd_near = formData.pd_near
      
      if (formData.ph_od !== null && formData.ph_od !== '') payload.ph_od = formData.ph_od
      if (formData.ph_os !== null && formData.ph_os !== '') payload.ph_os = formData.ph_os
      
      if (formData.doctor_name) payload.doctor_name = formData.doctor_name
      if (formData.doctor_license) payload.doctor_license = formData.doctor_license
      if (formData.prescription_date) payload.prescription_date = formData.prescription_date
      if (formData.expiry_date) payload.expiry_date = formData.expiry_date
      if (formData.notes) payload.notes = formData.notes

      let result
      if (editingId) {
        result = await updatePrescription(editingId, payload)
      } else {
        result = await createPrescription(payload)
      }

      if (result.success) {
        setMessage({ type: 'success', text: result.message || (editingId ? 'Prescription updated successfully' : 'Prescription created successfully') })
        setShowForm(false)
        resetForm()
        fetchPrescriptions()
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save prescription' })
      }
    } catch (error: any) {
      console.error('Error saving prescription:', error)
      setMessage({ type: 'error', text: error.message || 'An error occurred' })
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) return
    
    try {
      const result = await deletePrescription(id)
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Prescription deleted successfully' })
        fetchPrescriptions()
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to delete prescription' })
      }
    } catch (error: any) {
      console.error('Error deleting prescription:', error)
      setMessage({ type: 'error', text: error.message || 'An error occurred' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Prescription'}
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-current hover:opacity-70"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Prescription' : 'Add New Prescription'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prescription Type</label>
              <select
                value={formData.prescription_type}
                onChange={(e) => setFormData({ ...formData, prescription_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="single_vision">Single Vision</option>
                <option value="bifocal">Bifocal</option>
                <option value="progressive">Progressive</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Right Eye (OD)</h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    step="0.25"
                    placeholder="Sphere"
                    value={formData.od_sphere}
                    onChange={(e) => setFormData({ ...formData, od_sphere: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    step="0.25"
                    placeholder="Cylinder"
                    value={formData.od_cylinder}
                    onChange={(e) => setFormData({ ...formData, od_cylinder: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Axis"
                    value={formData.od_axis || ''}
                    onChange={(e) => setFormData({ ...formData, od_axis: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Left Eye (OS)</h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    step="0.25"
                    placeholder="Sphere"
                    value={formData.os_sphere}
                    onChange={(e) => setFormData({ ...formData, os_sphere: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    step="0.25"
                    placeholder="Cylinder"
                    value={formData.os_cylinder}
                    onChange={(e) => setFormData({ ...formData, os_cylinder: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Axis"
                    value={formData.os_axis || ''}
                    onChange={(e) => setFormData({ ...formData, os_axis: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Add Power</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.25"
                    placeholder="OD Add"
                    value={formData.od_add || ''}
                    onChange={(e) => setFormData({ ...formData, od_add: e.target.value || null })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    step="0.25"
                    placeholder="OS Add"
                    value={formData.os_add || ''}
                    onChange={(e) => setFormData({ ...formData, os_add: e.target.value || null })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Pupil Height (PH)</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="PH OD"
                    value={formData.ph_od || ''}
                    onChange={(e) => setFormData({ ...formData, ph_od: e.target.value || null })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="PH OS"
                    value={formData.ph_os || ''}
                    onChange={(e) => setFormData({ ...formData, ph_os: e.target.value || null })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                step="0.5"
                placeholder="PD Binocular"
                value={formData.pd_binocular}
                onChange={(e) => setFormData({ ...formData, pd_binocular: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                step="0.5"
                placeholder="PD Monocular OD"
                value={formData.pd_monocular_od}
                onChange={(e) => setFormData({ ...formData, pd_monocular_od: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                step="0.5"
                placeholder="PD Monocular OS"
                value={formData.pd_monocular_os}
                onChange={(e) => setFormData({ ...formData, pd_monocular_os: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Doctor Name"
                value={formData.doctor_name || ''}
                onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value || null })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Doctor License"
                value={formData.doctor_license || ''}
                onChange={(e) => setFormData({ ...formData, doctor_license: e.target.value || null })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                placeholder="Prescription Date"
                value={formData.prescription_date || ''}
                onChange={(e) => setFormData({ ...formData, prescription_date: e.target.value || null })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="date"
                placeholder="Expiry Date"
                value={formData.expiry_date || ''}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value || null })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                placeholder="Additional notes..."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update Prescription' : 'Save Prescription'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {prescriptions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No prescriptions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {prescription.prescription_type?.replace('_', ' ').toUpperCase() || 'PRESCRIPTION'}
                      </h3>
                      <span className="text-sm text-gray-500">
                        Created: {new Date(prescription.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Right Eye (OD)</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          {prescription.od_sphere && <p>Sphere: {prescription.od_sphere}</p>}
                          {prescription.od_cylinder && <p>Cylinder: {prescription.od_cylinder}</p>}
                          {prescription.od_axis && <p>Axis: {prescription.od_axis}°</p>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Left Eye (OS)</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          {prescription.os_sphere && <p>Sphere: {prescription.os_sphere}</p>}
                          {prescription.os_cylinder && <p>Cylinder: {prescription.os_cylinder}</p>}
                          {prescription.os_axis && <p>Axis: {prescription.os_axis}°</p>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600 space-y-1">
                      {prescription.pd_binocular && <p>PD Binocular: {prescription.pd_binocular}mm</p>}
                      {prescription.pd_monocular_od && <p>PD Monocular OD: {prescription.pd_monocular_od}mm</p>}
                      {prescription.pd_monocular_os && <p>PD Monocular OS: {prescription.pd_monocular_os}mm</p>}
                      {prescription.pd_near && <p>PD Near: {prescription.pd_near}mm</p>}
                      {prescription.od_add && <p>OD Add: {prescription.od_add}</p>}
                      {prescription.os_add && <p>OS Add: {prescription.os_add}</p>}
                      {prescription.ph_od && <p>PH OD: {prescription.ph_od}</p>}
                      {prescription.ph_os && <p>PH OS: {prescription.ph_os}</p>}
                      {prescription.doctor_name && <p>Doctor: {prescription.doctor_name}</p>}
                      {prescription.doctor_license && <p>License: {prescription.doctor_license}</p>}
                      {prescription.prescription_date && <p>Prescription Date: {new Date(prescription.prescription_date).toLocaleDateString()}</p>}
                      {prescription.expiry_date && <p>Expiry Date: {new Date(prescription.expiry_date).toLocaleDateString()}</p>}
                      {prescription.notes && <p>Notes: {prescription.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(prescription)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      title="Edit prescription"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(prescription.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete prescription"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Prescriptions

