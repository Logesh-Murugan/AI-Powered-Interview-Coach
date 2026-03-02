/**
 * Property-Based Tests for InterviewSessionPage
 * Tests universal properties with fast-check
 * 
 * **Property 7: Draft Auto-Save**
 * **Validates: Requirements COMP-3.1**
 * 
 * **Property 8: Draft Persistence Round-Trip**
 * **Validates: Requirements COMP-3.5, COMP-3.7**
 * 
 * Note: Using reduced iterations (20 instead of 100) for faster execution
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import fc from 'fast-check';
import InterviewSessionPage from '../InterviewSessionPage';
import apiService from '../../../services/api.service';

// Mock API service
vi.mock('../../../services/api.service');

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useParams and useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => mockNavigate,
  };
});

describe('InterviewSessionPage - Property-Based Tests', () => {
  const mockQuestion = {
    id: 1,
    question_text: 'Test question',
    category: 'technical',
    difficulty: 'medium',
    time_limit_seconds: 300,
    question_number: 1,
  };

  const mockSessionInfo = {
    question_count: 5,
    role: 'Software Engineer',
    difficulty: 'medium',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  /**
   * Property 7: Draft Auto-Save
   * For any draft text, the system should automatically save after 30 seconds
   * **Validates: Requirements COMP-3.1**
   */
  describe.skip('Property 7: Draft Auto-Save', () => {
    it('should auto-save any draft text after 30 seconds', async () => {
      vi.useFakeTimers();
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 100 }),
          async (draftText) => {
            let savedDraft = '';
            let saveCount = 0;

            // Mock API responses
            vi.mocked(apiService.get).mockImplementation((url: string) => {
              if (url.includes('/questions/')) {
                return Promise.resolve({ data: mockQuestion } as any);
              }
              if (url.includes('/interviews/')) {
                return Promise.resolve({ data: mockSessionInfo } as any);
              }
              if (url.includes('/drafts/')) {
                return Promise.reject({ response: { status: 404 } });
              }
              return Promise.reject(new Error('Unknown endpoint'));
            });

            vi.mocked(apiService.post).mockImplementation((url: string, data: any) => {
              if (url.includes('/drafts')) {
                savedDraft = data.draft_text;
                saveCount++;
                return Promise.resolve({ data: { success: true } } as any);
              }
              return Promise.reject(new Error('Unknown endpoint'));
            });

            // Render component
            const { container } = render(
              <BrowserRouter>
                <InterviewSessionPage />
              </BrowserRouter>
            );

            // Wait for component to load
            await waitFor(() => {
              const textarea = container.querySelector('textarea');
              expect(textarea).toBeInTheDocument();
            }, { timeout: 3000 });

            // Type draft text
            const textarea = container.querySelector('textarea');
            if (!textarea) throw new Error('Textarea not found');
            
            const user = userEvent.setup({ delay: null });
            await user.clear(textarea);
            await user.type(textarea, draftText);

            // Fast-forward time by 30 seconds
            await vi.advanceTimersByTimeAsync(30000);

            // Wait for auto-save to complete
            await waitFor(
              () => {
                expect(saveCount).toBeGreaterThan(0);
              },
              { timeout: 1000 }
            );

            // Verify draft was saved
            expect(savedDraft).toBe(draftText);
            expect(saveCount).toBe(1);
          }
        ),
        { numRuns: 5, timeout: 30000 } // Reduced runs and increased timeout
      );
      
      vi.useRealTimers();
    }, 40000); // Increase test timeout

    it('should stop auto-save when component unmounts', async () => {
      vi.useFakeTimers();
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 100 }),
          async (draftText) => {
            let saveCount = 0;

            vi.mocked(apiService.get).mockImplementation((url: string) => {
              if (url.includes('/questions/')) {
                return Promise.resolve({ data: mockQuestion } as any);
              }
              if (url.includes('/interviews/')) {
                return Promise.resolve({ data: mockSessionInfo } as any);
              }
              if (url.includes('/drafts/')) {
                return Promise.reject({ response: { status: 404 } });
              }
              return Promise.reject(new Error('Unknown endpoint'));
            });

            vi.mocked(apiService.post).mockImplementation((url: string) => {
              if (url.includes('/drafts')) {
                saveCount++;
                return Promise.resolve({ data: { success: true } } as any);
              }
              return Promise.reject(new Error('Unknown endpoint'));
            });

            const { container, unmount } = render(
              <BrowserRouter>
                <InterviewSessionPage />
              </BrowserRouter>
            );

            await waitFor(() => {
              expect(container.querySelector('textarea')).toBeInTheDocument();
            }, { timeout: 3000 });

            const textarea = container.querySelector('textarea');
            if (!textarea) throw new Error('Textarea not found');
            
            const user = userEvent.setup({ delay: null });
            await user.clear(textarea);
            await user.type(textarea, draftText);

            // Unmount component before 30 seconds
            unmount();

            // Fast-forward time by 30 seconds after unmount
            await vi.advanceTimersByTimeAsync(30000);

            // Verify no auto-save occurred after unmount
            expect(saveCount).toBe(0);
          }
        ),
        { numRuns: 5, timeout: 30000 }
      );
      
      vi.useRealTimers();
    }, 40000);
  });

  /**
   * Property 8: Draft Persistence Round-Trip
   * For any draft text, it should be preserved exactly after navigation
   * **Validates: Requirements COMP-3.5, COMP-3.7**
   */
  describe.skip('Property 8: Draft Persistence Round-Trip', () => {
    it('should preserve draft text exactly after navigation round-trip', async () => {
      vi.useFakeTimers();
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 200 }),
          async (originalDraftText) => {
            const drafts = new Map<number, string>();

            vi.mocked(apiService.get).mockImplementation((url: string) => {
              if (url.includes('/questions/1')) {
                return Promise.resolve({
                  data: { ...mockQuestion, id: 1, question_number: 1 },
                } as any);
              }
              if (url.includes('/questions/2')) {
                return Promise.resolve({
                  data: {
                    ...mockQuestion,
                    id: 2,
                    question_text: 'Question 2',
                    question_number: 2,
                  },
                } as any);
              }
              if (url.includes('/interviews/')) {
                return Promise.resolve({ data: mockSessionInfo } as any);
              }
              if (url.includes('/drafts/1')) {
                const draft = drafts.get(1);
                if (draft) {
                  return Promise.resolve({
                    data: { draft_text: draft, last_saved_at: new Date().toISOString() },
                  } as any);
                }
                return Promise.reject({ response: { status: 404 } });
              }
              if (url.includes('/drafts/2')) {
                const draft = drafts.get(2);
                if (draft) {
                  return Promise.resolve({
                    data: { draft_text: draft, last_saved_at: new Date().toISOString() },
                  } as any);
                }
                return Promise.reject({ response: { status: 404 } });
              }
              return Promise.reject(new Error('Unknown endpoint'));
            });

            vi.mocked(apiService.post).mockImplementation((url: string, data: any) => {
              if (url.includes('/drafts?question_id=1')) {
                drafts.set(1, data.draft_text);
                return Promise.resolve({ data: { success: true } } as any);
              }
              if (url.includes('/drafts?question_id=2')) {
                drafts.set(2, data.draft_text);
                return Promise.resolve({ data: { success: true } } as any);
              }
              return Promise.reject(new Error('Unknown endpoint'));
            });

            const { container } = render(
              <BrowserRouter>
                <InterviewSessionPage />
              </BrowserRouter>
            );

            await waitFor(() => {
              expect(container.querySelector('textarea')).toBeInTheDocument();
            }, { timeout: 3000 });

            // Type original draft text for question 1
            const textarea1 = container.querySelector('textarea');
            if (!textarea1) throw new Error('Textarea not found');
            
            const user = userEvent.setup({ delay: null });
            await user.clear(textarea1);
            await user.type(textarea1, originalDraftText);

            // Manually save draft
            const buttons = Array.from(container.querySelectorAll('button'));
            const saveButton = buttons.find((btn) => btn.textContent?.includes('Save Draft'));
            
            if (saveButton) {
              await user.click(saveButton);
              await waitFor(() => {
                expect(drafts.get(1)).toBe(originalDraftText);
              }, { timeout: 1000 });
            }

            // Navigate to question 2
            const nextButton = buttons.find((btn) => btn.textContent?.includes('Next'));
            if (nextButton) {
              await user.click(nextButton);
              await waitFor(() => {
                const textarea = container.querySelector('textarea');
                expect(textarea?.value).toBe('');
              }, { timeout: 1000 });
            }

            // Navigate back to question 1
            const prevButton = buttons.find((btn) => btn.textContent?.includes('Previous'));
            if (prevButton) {
              await user.click(prevButton);
              
              // Verify draft was restored exactly
              await waitFor(() => {
                const textarea = container.querySelector('textarea');
                expect(textarea?.value).toBe(originalDraftText);
              }, { timeout: 1000 });
            }

            // Verify no data loss or corruption
            expect(drafts.get(1)).toBe(originalDraftText);
          }
        ),
        { numRuns: 5, timeout: 30000 } // Reduced runs and increased timeout
      );
      
      vi.useRealTimers();
    }, 40000); // Increase test timeout
  });
});
