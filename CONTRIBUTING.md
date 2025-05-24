# Contributing to Recruitment Web Platform (RWP) 4.0

Thank you for your interest in contributing to the Recruitment Web Platform! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the best possible outcome for the project
- Show empathy towards other community members

## Development Workflow

### Repository Structure

This project uses a multi-repository architecture:

- **Main Repository (RWP 4.0)**: Core configuration, documentation, and shared code
- **Sub-repositories**:
  - `rwp-core`: Core infrastructure and shared functionality
  - `rwp-jobboard`: Public-facing job board
  - `rwp-jobadder`: JobAdder ATS integration
  - `rwp-events`: Event tracking system
  - `rwp-analytics`: Analytics and reporting
  - `rwp-ai-enrichment`: AI-powered data enrichment
  - `rwp-retargeting`: Candidate retargeting
  - `rwp-tenants`: Multi-tenant management

### Getting Started

1. Fork the repository you want to contribute to
2. Clone your fork locally
3. Set up the development environment
4. Create a new branch for your changes

### Making Changes

1. Make your changes in the appropriate repository
2. Follow the coding standards and conventions
3. Write tests for your changes
4. Ensure all tests pass
5. Update documentation as needed

### Submitting Changes

1. Commit your changes with clear, descriptive commit messages
2. Push your changes to your fork
3. Submit a pull request to the main repository
4. Respond to any feedback from the code review

## Coding Standards

### JavaScript/TypeScript

- Follow the ESLint configuration provided in the repository
- Use TypeScript for type safety
- Use async/await for asynchronous code
- Use meaningful variable and function names
- Add JSDoc comments for functions and complex code blocks

### React

- Use functional components with hooks
- Keep components small and focused
- Use React Context for state management when appropriate
- Follow the component structure used in the project

### CSS/Styling

- Use CSS Modules or Tailwind CSS as per the project's convention
- Follow a mobile-first approach for responsive design
- Use semantic class names

### Testing

- Write unit tests for utilities and components
- Write integration tests for API endpoints
- Aim for good test coverage of critical functionality

## Pull Request Process

1. Ensure your code follows the coding standards
2. Update documentation if necessary
3. Include tests for new functionality
4. Make sure all tests pass
5. Link any related issues in your pull request description
6. Wait for a review from a maintainer

## Shared Code Management

When working with shared code:

1. Make changes in the main repository
2. Use the `distribute-files.sh` script to copy changes to sub-repositories
3. Test changes in all affected repositories
4. Submit pull requests for all affected repositories

## Reporting Bugs

When reporting bugs, please include:

- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment information (browser, OS, etc.)

## Requesting Features

When requesting features, please include:

- A clear, descriptive title
- Detailed description of the feature
- Rationale for the feature
- Any relevant examples or mockups

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- MAJOR version for incompatible API changes
- MINOR version for new functionality in a backward-compatible manner
- PATCH version for backward-compatible bug fixes

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License.

## Questions?

If you have any questions about contributing, please reach out to the maintainers.

Thank you for contributing to the Recruitment Web Platform!