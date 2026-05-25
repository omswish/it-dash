import { render, screen, fireEvent } from '@testing-library/react';
import ConfigModal from '@/components/ConfigModal';

describe('ConfigModal', () => {
  const mockConfigs = {
    nutanix: { connected: false, endpoint: '', username: '', authMethod: '' },
    symphony: { connected: false, endpoint: '', username: '', authMethod: '' },
    solarwinds: { connected: false, endpoint: '', endpointNetwork: '', username: '', authMethod: '' }
  };
  
  it('prefills default values when empty', () => {
    render(<ConfigModal isOpen={true} onClose={() => {}} onSave={() => {}} configs={mockConfigs} />);
    
    // Nutanix is the default active tab
    expect(screen.getByDisplayValue('https://10.23.50.27:9440/console/#login')).toBeInTheDocument();
    expect(screen.getByDisplayValue('nutanix_admin')).toBeInTheDocument();
    
    // Switch to SolarWinds tab
    fireEvent.click(screen.getByText('SolarWinds Orion API'));
    
    expect(screen.getByDisplayValue('http://10.36.91.45/Orion/Login.aspx')).toBeInTheDocument();
    expect(screen.getByDisplayValue('http://10.36.91.46/Orion/Login.aspx')).toBeInTheDocument();
    expect(screen.getByDisplayValue('hil-dor.itdashboard@adityabirla.com')).toBeInTheDocument();
  });

  it('updates form state on input change', () => {
    render(<ConfigModal isOpen={true} onClose={() => {}} onSave={() => {}} configs={mockConfigs} />);
    fireEvent.click(screen.getByText('SolarWinds Orion API'));
    
    const networkPortalInput = screen.getByDisplayValue('http://10.36.91.46/Orion/Login.aspx');
    fireEvent.change(networkPortalInput, { target: { value: 'http://new-network-portal' } });
    
    expect(screen.getByDisplayValue('http://new-network-portal')).toBeInTheDocument();
  });
});
