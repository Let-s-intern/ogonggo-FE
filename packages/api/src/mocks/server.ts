import { setupServer } from 'msw/node';
import { enumHandlers } from './enums';
import { handlers } from './handlers';

export const server = setupServer(...handlers, ...enumHandlers);
