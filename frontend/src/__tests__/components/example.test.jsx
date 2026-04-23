import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

describe('Example React Component Test', () => {
  it('should demonstrate component rendering', () => {
    const TestComponent = () => <div>Test Component</div>;
    
    render(<TestComponent />);
    
    const element = screen.getByText('Test Component');
    expect(element).toBeInTheDocument();
  });

  it('should test button interaction', async () => {
    const TestComponent = () => {
      const [count, setCount] = React.useState(0);
      return (
        <div>
          <button onClick={() => setCount(count + 1)}>Click me</button>
          <p>{count}</p>
        </div>
      );
    };

    render(<TestComponent />);
    const button = screen.getByRole('button', { name: /click me/i });
    
    await userEvent.click(button);
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
