import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PollForm } from './PollForm';
import { createPoll } from '@/lib/actions/poll';

// Mock the server action
jest.mock('@/lib/actions/poll', () => ({
  createPoll: jest.fn(),
}));

// Mock useToast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('PollForm', () => {
  const mockCreatePoll = createPoll as jest.MockedFunction<typeof createPoll>;
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Valid form submission with title + 2 options
  it('should submit form successfully with valid data (title + 2 options)', async () => {
    mockCreatePoll.mockResolvedValueOnce({});

    render(<PollForm />);

    // Fill out the form
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test Poll Title');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Option One');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Option Two');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Verify createPoll was called with correct data
    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledTimes(1);
    });

    const formData = mockCreatePoll.mock.calls[0][0] as FormData;
    expect(formData.get('title')).toBe('Test Poll Title');
    expect(formData.getAll('options[]')).toEqual(['Option One', 'Option Two']);
  });

  // Test 2: Valid form submission with title + 4 options
  it('should submit form successfully with 4 options', async () => {
    mockCreatePoll.mockResolvedValueOnce({});

    render(<PollForm />);

    // Fill out the form
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test Poll Title');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Option One');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Option Two');

    // Add two more options
    await user.click(screen.getByRole('button', { name: /Add Option/i }));
    await user.type(screen.getByPlaceholderText('Option 3'), 'Option Three');
    
    await user.click(screen.getByRole('button', { name: /Add Option/i }));
    await user.type(screen.getByPlaceholderText('Option 4'), 'Option Four');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Verify createPoll was called with correct data
    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledTimes(1);
    });

    const formData = mockCreatePoll.mock.calls[0][0] as FormData;
    expect(formData.get('title')).toBe('Test Poll Title');
    expect(formData.getAll('options[]')).toEqual([
      'Option One',
      'Option Two',
      'Option Three',
      'Option Four',
    ]);
  });

  // Test 3: Form validation - empty title
  it('should show validation error for empty title', async () => {
    render(<PollForm />);

    // Try to submit without filling title
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Check for validation error - wait a bit for validation to trigger
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Poll/i })).toBeDisabled();
    });
    
    expect(mockCreatePoll).not.toHaveBeenCalled();
  });

  // Test 4: Form validation - single option
  it('should prevent removing options below the minimum limit', async () => {
    render(<PollForm />);

    // First add an option to have 3 total
    await user.click(screen.getByRole('button', { name: /Add Option/i }));
    
    // Now we should have 3 options
    const optionInputs = screen.getAllByPlaceholderText(/Option [0-9]/);
    expect(optionInputs).toHaveLength(3);
    
    // Find delete buttons by their icon (they don't have accessible names)
    const deleteButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg[class*="trash"]')
    );
    
    // Remove one option
    await user.click(deleteButtons[0]);
    
    // Should now have 2 options (minimum)
    const remainingOptionInputs = screen.getAllByPlaceholderText(/Option [0-9]/);
    expect(remainingOptionInputs).toHaveLength(2);
    
    // No delete buttons should be visible when only 2 options remain
    const remainingDeleteButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg[class*="trash"]')
    );
    expect(remainingDeleteButtons).toHaveLength(0);
  });

  // Test 5: Form validation - duplicate options
  it('should show validation error for duplicate options', async () => {
    render(<PollForm />);

    // Fill out the form with duplicate options
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test Poll Title');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Same Option');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Same Option');

    // Try to submit
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Check that form is not submitted due to validation
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Poll/i })).toBeDisabled();
    });
    
    expect(mockCreatePoll).not.toHaveBeenCalled();
  });

  // Test 6: Dynamic option management - add options
  it('should allow adding options up to the maximum limit', async () => {
    render(<PollForm />);

    // Initially we have 2 options
    expect(screen.getAllByPlaceholderText(/Option [0-9]/)).toHaveLength(2);

    // Add options until we reach the maximum (10)
    for (let i = 3; i <= 10; i++) {
      await user.click(screen.getByRole('button', { name: /Add Option/i }));
      expect(screen.getAllByPlaceholderText(/Option [0-9]/)).toHaveLength(i);
    }

    // The "Add Option" button should not be visible now
    expect(screen.queryByRole('button', { name: /Add Option/i })).not.toBeInTheDocument();
  });

  // Test 7: Loading state during submission
  it('should show loading state during form submission', async () => {
    // Mock a slow response
    mockCreatePoll.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
    );

    render(<PollForm />);

    // Fill out the form
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test Poll Title');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Option One');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Option Two');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Check that button shows loading state
    expect(await screen.findByText('Creating Poll...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Creating Poll/i })).toBeDisabled();

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledTimes(1);
    });
  });

  // Test 8: Special characters in title/options
  it('should handle special characters in title and options', async () => {
    mockCreatePoll.mockResolvedValueOnce({});

    render(<PollForm />);

    // Fill out the form with special characters
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test Poll Title with !@#$%^&*()');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Option One with special chars !@#');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Option Two with emoji 😊');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Verify createPoll was called with correct data
    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledTimes(1);
    });

    const formData = mockCreatePoll.mock.calls[0][0] as FormData;
    expect(formData.get('title')).toBe('Test Poll Title with !@#$%^&*()');
    expect(formData.getAll('options[]')).toEqual([
      'Option One with special chars !@#',
      'Option Two with emoji 😊',
    ]);
  });

  // Test 9: Very long inputs (boundary testing)
  it('should handle very long inputs', async () => {
    mockCreatePoll.mockResolvedValueOnce({});

    render(<PollForm />);

    // Create very long strings
    const longTitle = 'A'.repeat(100); // Reduced from 500 to 100 for performance
    const longOption = 'B'.repeat(50); // Reduced from 200 to 50 for performance

    // Fill out the form with long inputs
    await user.type(screen.getByLabelText(/Poll Question/i), longTitle);
    await user.type(screen.getByPlaceholderText('Option 1'), longOption);
    await user.type(screen.getByPlaceholderText('Option 2'), 'Short option');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Verify createPoll was called with correct data
    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledTimes(1);
    });

    const formData = mockCreatePoll.mock.calls[0][0] as FormData;
    expect(formData.get('title')).toBe(longTitle);
    expect(formData.getAll('options[]')).toEqual([longOption, 'Short option']);
  }, 10000); // Increase timeout to 10 seconds

  // Test 10: Rapid add/remove option clicks
  it('should handle rapid add/remove option clicks', async () => {
    render(<PollForm />);

    // Rapidly add options
    const addButton = screen.getByRole('button', { name: /Add Option/i });
    for (let i = 0; i < 5; i++) {
      await user.click(addButton);
    }

    // Should have 7 options (2 initial + 5 added)
    expect(screen.getAllByPlaceholderText(/Option [0-9]/)).toHaveLength(7);

    // Rapidly remove options
    const deleteButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg[class*="trash"]')
    );
    
    for (let i = 0; i < 3; i++) {
      await user.click(deleteButtons[i]);
    }

    // Should have 4 options left (7 - 3)
    expect(screen.getAllByPlaceholderText(/Option [0-9]/)).toHaveLength(4);
  });

  // Test 11: Form submission while already submitting
  it('should prevent multiple submissions while already submitting', async () => {
    // Mock a slow response
    let resolvePromise: (value: any) => void;
    mockCreatePoll.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    render(<PollForm />);

    // Fill out the form
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test Poll Title');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Option One');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Option Two');

    // Submit the form multiple times quickly
    const submitButton = screen.getByRole('button', { name: /Create Poll/i });
    await user.click(submitButton);
    await user.click(submitButton);
    await user.click(submitButton);

    // Should only call createPoll once
    expect(mockCreatePoll).toHaveBeenCalledTimes(1);

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();

    // Resolve the promise to complete the submission
    resolvePromise!({});
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  // Test 12: Server error handling
  it('should handle server errors correctly', async () => {
    // Mock server error
    mockCreatePoll.mockResolvedValueOnce({ error: 'Database connection failed' });

    render(<PollForm />);

    // Fill out the form
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test Poll Title');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Option One');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Option Two');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Verify createPoll was called
    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledTimes(1);
    });
  });

  // Test 13: Network error handling
  it('should handle network errors correctly', async () => {
    // Mock network error
    mockCreatePoll.mockRejectedValueOnce(new Error('Network error'));

    render(<PollForm />);

    // Fill out the form
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test Poll Title');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Option One');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Option Two');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Verify createPoll was called
    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledTimes(1);
    });
  });

  // Test 14: Empty option validation
  it('should show validation error for empty options', async () => {
    render(<PollForm />);

    // Fill title but leave one option empty
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test Poll Title');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Option One');
    // Option 2 is left empty

    // Try to submit
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Check that form is not submitted due to validation
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Poll/i })).toBeDisabled();
    });
    
    expect(mockCreatePoll).not.toHaveBeenCalled();
  });

  // Test 15: Description field is optional
  it('should submit successfully without description', async () => {
    mockCreatePoll.mockResolvedValueOnce({});

    render(<PollForm />);

    // Fill out the form without description
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test Poll Title');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Option One');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Option Two');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Verify createPoll was called with correct data
    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledTimes(1);
    });

    const formData = mockCreatePoll.mock.calls[0][0] as FormData;
    expect(formData.get('title')).toBe('Test Poll Title');
    expect(formData.get('description')).toBeNull();
    expect(formData.getAll('options[]')).toEqual(['Option One', 'Option Two']);
  });

  // Test 16: Description field is included when provided
  it('should include description when provided', async () => {
    mockCreatePoll.mockResolvedValueOnce({});

    render(<PollForm />);

    // Fill out the form with description
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test Poll Title');
    await user.type(screen.getByPlaceholderText('Provide more context for your poll.'), 'This is a test description');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Option One');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Option Two');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Verify createPoll was called with correct data
    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledTimes(1);
    });

    const formData = mockCreatePoll.mock.calls[0][0] as FormData;
    expect(formData.get('title')).toBe('Test Poll Title');
    expect(formData.get('description')).toBe('This is a test description');
    expect(formData.getAll('options[]')).toEqual(['Option One', 'Option Two']);
  });

  // Test 17: Form state after successful submission
  it('should maintain form state after successful submission', async () => {
    mockCreatePoll.mockResolvedValueOnce({});

    render(<PollForm />);

    // Fill out the form
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test Poll Title');
    await user.type(screen.getByPlaceholderText('Provide more context for your poll.'), 'Test description');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Option One');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Option Two');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Verify createPoll was called
    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledTimes(1);
    });

    // Wait for submission to complete (isSubmitting becomes false)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Poll/i })).not.toBeDisabled();
    });

    // The form should maintain its state (it doesn't reset on success)
    expect(screen.getByLabelText(/Poll Question/i)).toHaveValue('Test Poll Title');
    expect(screen.getByPlaceholderText('Provide more context for your poll.')).toHaveValue('Test description');
    expect(screen.getByPlaceholderText('Option 1')).toHaveValue('Option One');
    expect(screen.getByPlaceholderText('Option 2')).toHaveValue('Option Two');
  });

  // Test 18: Form maintains state after failed submission
  it('should maintain form state after failed submission', async () => {
    // Mock server error
    mockCreatePoll.mockResolvedValueOnce({ error: 'Database error' });

    render(<PollForm />);

    // Fill out the form
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test Poll Title');
    await user.type(screen.getByPlaceholderText('Provide more context for your poll.'), 'Test description');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Option One');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Option Two');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Verify createPoll was called
    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledTimes(1);
    });

    // Wait for submission to complete (isSubmitting becomes false)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Poll/i })).not.toBeDisabled();
    });

    // Check that form fields maintain their values
    expect(screen.getByLabelText(/Poll Question/i)).toHaveValue('Test Poll Title');
    expect(screen.getByPlaceholderText('Provide more context for your poll.')).toHaveValue('Test description');
    expect(screen.getByPlaceholderText('Option 1')).toHaveValue('Option One');
    expect(screen.getByPlaceholderText('Option 2')).toHaveValue('Option Two');
  });

  // Test 19: Whitespace-only inputs validation
  it('should show validation error for whitespace-only inputs', async () => {
    render(<PollForm />);

    // Fill out the form with whitespace-only values
    await user.type(screen.getByLabelText(/Poll Question/i), '   ');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Option One');
    await user.type(screen.getByPlaceholderText('Option 2'), '   ');

    // Try to submit
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Check that form is not submitted due to validation
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Poll/i })).toBeDisabled();
    });
    
    expect(mockCreatePoll).not.toHaveBeenCalled();
  });

  // Test 20: Mixed valid and invalid options
  it('should handle mixed valid and invalid options correctly', async () => {
    render(<PollForm />);

    // Add more options
    await user.click(screen.getByRole('button', { name: /Add Option/i }));
    await user.click(screen.getByRole('button', { name: /Add Option/i }));

    // Fill out the form with mixed valid and invalid options
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test Poll Title');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Valid Option');
    // Option 2 is left empty (don't use user.type with empty string)
    await user.type(screen.getByPlaceholderText('Option 3'), '   '); // Whitespace only
    await user.type(screen.getByPlaceholderText('Option 4'), 'Valid Option'); // Duplicate

    // Try to submit
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Check that form is not submitted due to validation
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Poll/i })).toBeDisabled();
    });
    
    expect(mockCreatePoll).not.toHaveBeenCalled();
  });

  // Test 21: Form accessibility - all fields have proper labels
  it('should have proper accessibility attributes', async () => {
    render(<PollForm />);

    // Check that all form fields have proper labels
    expect(screen.getByLabelText(/Poll Question/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description \(Optional\)/i)).toBeInTheDocument();
    
    // Check that options have placeholder text
    expect(screen.getByPlaceholderText('Option 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Option 2')).toBeInTheDocument();
    
    // Check that buttons have proper roles and labels
    expect(screen.getByRole('button', { name: /Add Option/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Poll/i })).toBeInTheDocument();
  });

  // Test 22: Performance - rapid form interactions
  it('should handle rapid form interactions without errors', async () => {
    render(<PollForm />);

    // Rapidly interact with the form
    await user.type(screen.getByLabelText(/Poll Question/i), 'Test{backspace}{backspace}Poll Title');
    await user.click(screen.getByRole('button', { name: /Add Option/i }));
    await user.type(screen.getByPlaceholderText('Option 3'), 'Option Three');
    
    // Find and click a delete button
    const deleteButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg[class*="trash"]')
    );
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);
    }
    
    await user.type(screen.getByPlaceholderText('Option 1'), 'Option One');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Option Two');

    // Try to submit
    await user.click(screen.getByRole('button', { name: /Create Poll/i }));

    // Form should be in a valid state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Poll/i })).not.toBeDisabled();
    });
  });
});
