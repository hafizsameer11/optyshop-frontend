/**
 * Contact Lens Configuration Dropdown Component
 * Displays a dropdown of available contact lens configurations
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ContactLensConfiguration } from '../../services/contactLensConfigService';

interface ContactLensConfigurationDropdownProps {
  configurations: ContactLensConfiguration[];
  selectedConfigId: number | null;
  onSelect: (config: ContactLensConfiguration | null) => void;
  disabled?: boolean;
  className?: string;
}

const ContactLensConfigurationDropdown: React.FC<ContactLensConfigurationDropdownProps> = ({
  configurations,
  selectedConfigId,
  onSelect,
  disabled = false,
  className = ''
}) => {
  const { t } = useTranslation();

  // Group configurations by type
  const sphericalConfigs = configurations.filter(c => c.configuration_type === 'spherical');
  const astigmatismConfigs = configurations.filter(c => c.configuration_type === 'astigmatism');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const configId = e.target.value ? parseInt(e.target.value, 10) : null;
    const selectedConfig = configId 
      ? configurations.find(c => c.id === configId) || null
      : null;
    onSelect(selectedConfig);
  };

  if (configurations.length === 0) {
    return null;
  }

  return (
    <div className={`mb-6 ${className}`}>
      <label className="block text-sm font-semibold text-gray-900 mb-3">
        {t('shop.contactLensConfiguration', 'Contact Lens Configuration')}
        <span className="text-xs font-normal text-gray-500 ml-2">
          ({t('shop.selectConfiguration', 'Select a configuration')})
        </span>
      </label>
      <select
        value={selectedConfigId || ''}
        onChange={handleChange}
        disabled={disabled}
        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          disabled 
            ? 'bg-gray-100 cursor-not-allowed border-gray-300' 
            : 'bg-white border-gray-300 hover:border-blue-400'
        } ${className}`}
      >
        <option value="">
          {t('shop.selectConfiguration', '-- Select Configuration --')}
        </option>
        
        {sphericalConfigs.length > 0 && (
          <optgroup label={t('shop.spherical', 'Spherical')}>
            {sphericalConfigs.map((config) => {
              const price = typeof config.price === 'string' ? parseFloat(config.price) : config.price
              const priceStr = isNaN(price) ? '' : ` - $${price.toFixed(2)}`
              return (
                <option key={config.id} value={config.id}>
                  {config.display_name || config.name}{priceStr}
                </option>
              )
            })}
          </optgroup>
        )}
        
        {astigmatismConfigs.length > 0 && (
          <optgroup label={t('shop.astigmatism', 'Astigmatism')}>
            {astigmatismConfigs.map((config) => {
              const price = typeof config.price === 'string' ? parseFloat(config.price) : config.price
              const priceStr = isNaN(price) ? '' : ` - $${price.toFixed(2)}`
              return (
                <option key={config.id} value={config.id}>
                  {config.display_name || config.name}{priceStr}
                </option>
              )
            })}
          </optgroup>
        )}
      </select>
      
      {selectedConfigId && (
        <p className="text-xs text-gray-500 mt-2">
          {t('shop.configurationSelected', 'Configuration selected. Please fill in the form below.')}
        </p>
      )}
    </div>
  );
};

export default ContactLensConfigurationDropdown;


