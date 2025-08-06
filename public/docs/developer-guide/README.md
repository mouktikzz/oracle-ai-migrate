# Developer Guide

Welcome to the developer documentation for the Sybase to Oracle Migration Tool. This guide provides comprehensive information for developers who want to contribute to, customize, or integrate with the application.

## 📚 Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Contributing Guidelines](#contributing-guidelines)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)

## 🛠️ Development Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **bun** package manager
- **Git** for version control
- **Docker** (optional, for containerized development)
- **VS Code** (recommended IDE)

### Environment Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Kbc981/oracle-ai-migrate-gcp.git
   cd oracle-ai-migrate-gcp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # AI Services
   VITE_GEMINI_API_KEY=your_gemini_api_key
   
   # Optional: Oracle Connection (for deployment features)
   ORACLE_CONNECTION_STRING=your_oracle_connection
   
   # Development
   VITE_DEV_MODE=true
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   Open [http://localhost:5173](http://localhost:5173) in your browser.

### IDE Configuration

#### VS Code Extensions (Recommended)
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

#### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── dashboard/      # Dashboard-specific components
│   ├── CodeEditor.tsx  # Monaco editor wrapper
│   ├── CodeUploader.tsx # File upload logic
│   └── ...
├── pages/              # Route components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── AdminPanel.tsx  # Admin interface
│   ├── History.tsx     # Migration history
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication logic
│   ├── useAdmin.tsx    # Admin functionality
│   └── ...
├── contexts/           # React contexts
│   └── CodeEditorThemeContext.tsx
├── utils/              # Utility functions
│   ├── conversionUtils.ts        # Core conversion logic
│   ├── componentUtilswithlangchain.ts # AI integration
│   └── databaseUtils.ts          # Database operations
├── types/              # TypeScript type definitions
│   ├── index.ts        # Core types
│   ├── admin.ts        # Admin-specific types
│   └── ...
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Library configurations
│   └── utils.ts        # Utility functions
└── App.tsx             # Main application component
```

### Key Directories Explained

#### `/components`
Reusable React components organized by functionality:
- **ui/**: Base UI components from shadcn/ui
- **dashboard/**: Dashboard-specific components
- **Component files**: Specific functionality components

#### `/hooks`
Custom React hooks for state management and side effects:
- **useAuth**: Authentication state and methods
- **useAdmin**: Administrative functions
- **useUnreviewedFiles**: File management logic

#### `/utils`
Core business logic and utility functions:
- **conversionUtils.ts**: Sybase to Oracle conversion algorithms
- **componentUtilswithlangchain.ts**: AI model integration
- **databaseUtils.ts**: Database operation helpers

#### `/types`
TypeScript type definitions for type safety:
- **index.ts**: Core application types
- **admin.ts**: Admin panel types
- **unreviewedFiles.ts**: File management types

## 🤝 Contributing Guidelines

### Code Style

We use ESLint and Prettier for code formatting. Configuration files:
- **eslint.config.js**: ESLint rules
- **prettier.config.js**: Prettier formatting

#### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useAuth.tsx`)
- **Types**: PascalCase (`DatabaseConnection`)
- **Variables**: camelCase (`isLoading`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_ENDPOINTS`)

#### Component Structure
```tsx
// Good component structure
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import type { ConversionResult } from '@/types';

interface MyComponentProps {
  title: string;
  onSubmit: (data: ConversionResult) => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  onSubmit 
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Component logic
  }, []);

  return (
    <div className="flex flex-col space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {/* Component JSX */}
    </div>
  );
};

export default MyComponent;
```

### Git Workflow

#### Branch Naming
- **Feature**: `feature/add-user-authentication`
- **Bug Fix**: `bugfix/fix-upload-error`
- **Hotfix**: `hotfix/security-patch`
- **Documentation**: `docs/update-api-docs`

#### Commit Messages
Follow conventional commits format:
```
type(scope): description

feat(auth): add Google OAuth integration
fix(upload): resolve file size validation
docs(api): update endpoint documentation
refactor(components): simplify code editor logic
test(conversion): add unit tests for AI conversion
```

#### Pull Request Process
1. **Create feature branch** from `main`
2. **Implement changes** with tests
3. **Run linting and tests**: `npm run lint && npm run test`
4. **Update documentation** if needed
5. **Create pull request** with detailed description
6. **Request review** from maintainers
7. **Address feedback** and update PR
8. **Merge** after approval

### Testing Guidelines

#### Unit Tests
```typescript
// Example test file: __tests__/utils/conversionUtils.test.ts
import { convertSybaseToOracle } from '@/utils/conversionUtils';

describe('convertSybaseToOracle', () => {
  it('should convert basic stored procedure', () => {
    const sybaseCode = `
      CREATE PROCEDURE GetUser @userId INT
      AS
      BEGIN
        SELECT * FROM Users WHERE UserId = @userId
      END
    `;
    
    const result = convertSybaseToOracle(sybaseCode);
    
    expect(result.oracleCode).toContain('CREATE OR REPLACE PROCEDURE');
    expect(result.oracleCode).toContain('p_userId IN NUMBER');
  });
});
```

#### Component Tests
```typescript
// Example: __tests__/components/CodeUploader.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeUploader } from '@/components/CodeUploader';

describe('CodeUploader', () => {
  it('should handle file upload', () => {
    const onUpload = jest.fn();
    render(<CodeUploader onUpload={onUpload} />);
    
    const file = new File(['test content'], 'test.sql', { type: 'text/sql' });
    const input = screen.getByLabelText(/upload/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(onUpload).toHaveBeenCalledWith([expect.objectContaining({
      name: 'test.sql',
      content: 'test content'
    })]);
  });
});
```

### Performance Guidelines

#### React Performance
- **Use React.memo** for expensive components
- **Implement useMemo** for expensive calculations
- **Use useCallback** for event handlers passed to children
- **Lazy load** large components with React.lazy

#### Bundle Optimization
- **Code splitting**: Use dynamic imports for large dependencies
- **Tree shaking**: Ensure unused code is eliminated
- **Image optimization**: Use appropriate formats and sizes
- **Minimize dependencies**: Regular dependency audits

## 📡 API Reference

### Core Types

```typescript
// Core data structures
interface CodeFile {
  id: string;
  name: string;
  content: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

interface ConversionResult {
  id: string;
  fileId: string;
  originalCode: string;
  convertedCode: string;
  status: 'success' | 'warning' | 'error';
  issues: ConversionIssue[];
  metrics: ConversionMetrics;
}

interface ConversionIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}
```

### Conversion Utils API

```typescript
// Main conversion function
export async function convertSybaseToOracle(
  code: string,
  options: ConversionOptions = {}
): Promise<ConversionResult>

// Batch conversion
export async function convertMultipleFiles(
  files: CodeFile[],
  options: ConversionOptions = {}
): Promise<ConversionResult[]>

// Validation
export function validateOracleCode(
  code: string
): ValidationResult

// Report generation
export async function generateConversionReport(
  results: ConversionResult[]
): Promise<ConversionReport>
```

### AI Integration API

```typescript
// AI model interface
interface AIModel {
  name: string;
  convert(code: string, context?: string): Promise<string>;
  validateResponse(response: string): boolean;
}

// Gemini AI implementation
export class GeminiAIModel implements AIModel {
  constructor(apiKey: string);
  convert(code: string, context?: string): Promise<string>;
  validateResponse(response: string): boolean;
}
```

### Database Operations

```typescript
// Supabase integration
export const supabaseClient = createClient(url, key);

// CRUD operations
export async function saveMigration(migration: Migration): Promise<void>
export async function getMigrationHistory(userId: string): Promise<Migration[]>
export async function updateMigrationStatus(id: string, status: string): Promise<void>
export async function deleteMigration(id: string): Promise<void>
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test CodeUploader.test.tsx
```

### Test Structure

```
__tests__/
├── components/          # Component tests
├── hooks/              # Hook tests
├── utils/              # Utility function tests
├── integration/        # Integration tests
└── setup.ts           # Test configuration
```

### Writing Tests

#### Best Practices
1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Keep tests focused and atomic**
4. **Mock external dependencies**
5. **Test error conditions**

#### Testing Hooks
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth', () => {
  it('should handle login', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('user@example.com', 'password');
    });
    
    expect(result.current.user).toBeDefined();
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

## 🚀 Deployment

### Build Process

```bash
# Production build
npm run build

# Development build
npm run build:dev

# Preview production build
npm run preview
```

### Docker Deployment

```dockerfile
# Production Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Configuration

```bash
# Build for different environments
npm run build -- --mode production
npm run build -- --mode staging
npm run build -- --mode development
```

### CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - name: Deploy to production
        run: |
          # Deployment commands
```

This developer guide provides the foundation for contributing to and extending the Sybase to Oracle Migration Tool. For specific questions or clarifications, please refer to the inline code documentation or reach out to the development team.