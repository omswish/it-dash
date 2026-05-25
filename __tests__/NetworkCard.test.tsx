import { render, screen } from '@testing-library/react';
import NetworkCard from '@/components/NetworkCard';

describe('NetworkCard', () => {
  it('renders operational RJIO link correctly', () => {
    render(<NetworkCard id="1" provider="RJIO SDWAN" status="operational" uptime={100} latency={12} utilization={45} history={[45, 45, 45]} />);
    
    // Status text
    expect(screen.getByText('operational')).toBeInTheDocument();
    
    // Utilization text
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('renders degraded state in red color styles', () => {
    const { container } = render(<NetworkCard id="2" provider="Airtel ILL" status="degraded" uptime={98} latency={150} utilization={90} history={[90, 90]} />);
    
    expect(screen.getByText('degraded')).toBeInTheDocument();
    // The main primary color for degraded/critical is #ef4444 (red)
    // The loadGradient should contain it
    const loadBar = container.querySelector('div[style*="linear-gradient(to right, #ef4444, #dc2626)"]');
    expect(loadBar).toBeInTheDocument();
  });
});
