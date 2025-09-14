# Contributing to SwingVista

Thank you for your interest in contributing to SwingVista! This document provides guidelines and information for contributors.

## Code of Conduct

This project follows a code of conduct that we expect all contributors to follow. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Development Setup

1. **Fork the repository**
   - Click the "Fork" button on GitHub
   - Clone your fork locally

2. **Set up the development environment**
   ```bash
   git clone https://github.com/yourusername/swingvista.git
   cd swingvista
   npm install
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes**
   - Follow the coding standards
   - Add tests for new features
   - Update documentation as needed

5. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

7. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use meaningful variable and function names

### React/Next.js

- Use functional components with hooks
- Follow Next.js best practices
- Use proper error boundaries
- Implement proper loading states

### CSS/Styling

- Use Tailwind CSS for styling
- Follow the design system
- Use semantic class names
- Ensure responsive design

### File Organization

- Keep components small and focused
- Use proper folder structure
- Group related files together
- Use descriptive file names

## Commit Convention

We use conventional commits for clear commit messages:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Build process or auxiliary tool changes

Examples:
```
feat: add swing comparison feature
fix: resolve camera permission issue
docs: update API documentation
```

## Pull Request Process

1. **Create a descriptive title**
   - Use the commit convention format
   - Be clear about what the PR does

2. **Write a detailed description**
   - Explain what changes were made
   - Include screenshots if UI changes
   - Reference any related issues

3. **Ensure all checks pass**
   - Tests must pass
   - Linting must pass
   - Type checking must pass
   - Build must succeed

4. **Request review**
   - Assign appropriate reviewers
   - Respond to feedback promptly
   - Make requested changes

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for new features
- Test edge cases and error conditions
- Aim for good test coverage
- Use descriptive test names

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });
  
  it('should handle user interaction', () => {
    // Test implementation
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for functions
- Document complex algorithms
- Explain non-obvious code
- Keep comments up to date

### README Updates

- Update README for new features
- Include usage examples
- Update installation instructions
- Keep feature list current

## Issue Reporting

### Before Creating an Issue

1. Check existing issues
2. Search for similar problems
3. Verify it's not a duplicate

### Creating a Good Issue

- Use a clear, descriptive title
- Provide steps to reproduce
- Include expected vs actual behavior
- Add relevant system information
- Include screenshots if applicable

### Issue Templates

Use the provided issue templates:
- Bug report
- Feature request
- Documentation improvement

## Feature Requests

### Before Submitting

1. Check if the feature already exists
2. Consider if it fits the project scope
3. Think about implementation complexity

### Submitting a Feature Request

- Use the feature request template
- Provide a clear description
- Explain the use case
- Consider implementation approach
- Be open to discussion

## Development Guidelines

### Performance

- Optimize for performance
- Use proper caching strategies
- Minimize bundle size
- Consider mobile performance

### Accessibility

- Follow WCAG guidelines
- Use semantic HTML
- Provide proper ARIA labels
- Ensure keyboard navigation

### Security

- Validate all inputs
- Sanitize user data
- Use secure coding practices
- Follow OWASP guidelines

## Release Process

### Version Numbering

We use semantic versioning (SemVer):
- `MAJOR` - Breaking changes
- `MINOR` - New features (backward compatible)
- `PATCH` - Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Release notes prepared

## Getting Help

### Community

- GitHub Discussions for questions
- Issues for bug reports
- Pull requests for contributions

### Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [MediaPipe Documentation](https://mediapipe.dev/)

## Recognition

Contributors will be recognized in:
- README contributors section
- Release notes
- Project documentation

Thank you for contributing to SwingVista! 🏌️
