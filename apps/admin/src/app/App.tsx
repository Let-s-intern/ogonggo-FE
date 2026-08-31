import { HomePage } from '../pages/home';
import { AppProviders } from './providers';

export function App() {
  return (
    <AppProviders>
      <HomePage />
    </AppProviders>
  );
}
