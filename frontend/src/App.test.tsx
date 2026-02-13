import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { store } from './store';
import AppRoutes from './routes/AppRoutes';

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AppRoutes />
        </MemoryRouter>
      </Provider>
    );
    expect(document.body).toBeTruthy();
  });
});
