
# Sybase to Oracle Migration Tool

<div align="center">

# 🚀 Sybase to Oracle Migration Tool

**AI-Powered Database Migration Made Simple**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

[🚀 Quick Start](#quick-start) • [📖 Documentation](./docs/README.md) • [🔧 API](./docs/api/README.md) • [💬 Support](#support)

</div>

## 🌟 Overview

Transform your Sybase database code to Oracle-compatible syntax with our intelligent AI-powered migration tool. Built for enterprise-scale migrations, this tool combines the power of Google Gemini AI with advanced conversion algorithms to ensure accurate, efficient, and reliable database migrations.

### 🤖 AI Chatbot Assistant

The application includes an intelligent AI chatbot to help with your migration:

- **Access**: Click the chat icon in the bottom-right corner
- **Ask Questions**: Get help with migration strategies, code explanations, and best practices
- **Code Analysis**: Upload code snippets for detailed analysis and conversion guidance
- **Quick Suggestions**: Use pre-built questions for common migration scenarios

For detailed chatbot documentation, see [CHATBOT_README.md](./CHATBOT_README.md)

### 🎯 Key Benefits

- **🤖 AI-Powered**: Leverage Google Gemini AI for superior conversion accuracy
- **⚡ Fast & Efficient**: Process multiple files simultaneously with batch operations
- **🔍 Quality Assurance**: Advanced diff viewer and comprehensive validation
- **📊 Detailed Reporting**: Generate professional migration reports for stakeholders
- **🚀 Direct Deployment**: Deploy converted code directly to Oracle databases
- **👥 Team Collaboration**: Multi-user support with role-based access control

## ✨ Features

### Core Functionality
- **📁 Multi-Format Support**: SQL, Stored Procedures, Functions, Triggers, DDL
- **🔄 Batch Processing**: Upload and convert entire directories
- **🎨 Visual Diff Viewer**: Side-by-side code comparison with syntax highlighting
- **📈 Progress Tracking**: Real-time conversion progress and status updates
- **💾 Export Options**: Download individual files or complete migration packages
- **🤖 AI Chatbot Assistant**: Get help with migration questions, code explanations, and best practices

### Advanced Features
- **🧠 Multiple AI Models**: Choose between Gemini AI, Default, or Custom models
- **⚙️ Custom Rules**: Define organization-specific conversion rules
- **🔗 API Integration**: RESTful API for programmatic access
- **📋 Migration History**: Complete audit trail of all conversions
- **🛡️ Enterprise Security**: Role-based access, encryption, and audit logging

### Administrative Capabilities
- **👤 User Management**: Comprehensive user and role administration
- **📊 System Monitoring**: Real-time performance metrics and health checks
- **🗂️ File Management**: Centralized file organization and lifecycle management
- **📈 Analytics Dashboard**: Conversion success rates and usage statistics

## 🛠️ Technology Stack

<div align="center">

| Frontend | Backend | AI/ML | Infrastructure |
|----------|---------|-------|----------------|
| React 18 | Supabase | Gemini AI | Docker |
| TypeScript | PostgreSQL | LangChain | Nginx |
| Vite | Supabase Auth | OpenAI (Optional) | Cloud Deploy |
| Tailwind CSS | Supabase Storage | Custom Models | CI/CD |
| shadcn/ui | Edge Functions | | Monitoring |

</div>

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ or Bun
- Modern web browser
- Supabase account
- Gemini AI API key

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/Kbc981/oracle-ai-migrate-gcp.git
cd oracle-ai-migrate-gcp

# Install dependencies
npm install
# or
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 3. Configuration

```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 5. First Migration

1. **Sign Up**: Create your account at `http://localhost:5173`
2. **Upload Files**: Drag and drop your Sybase SQL files
3. **Choose AI Model**: Select Gemini AI for best results
4. **Review Results**: Use the diff viewer to validate conversions
5. **Generate Report**: Create comprehensive migration documentation
6. **Download**: Get your Oracle-compatible code

## 🐳 Docker Deployment

### Quick Deploy

```bash
# Build and run with Docker
docker build -t sybase-oracle-migration .
docker run -p 8080:80 sybase-oracle-migration
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## 📖 Documentation

Our comprehensive documentation covers every aspect of the migration tool:

| Document | Description |
|----------|-------------|
| [📋 User Guide](./docs/user-guide/README.md) | Complete user manual and tutorials |
| [🏗️ Architecture](./docs/architecture.md) | System design and component overview |
| [👩‍💻 Developer Guide](./docs/developer-guide/README.md) | Setup, contributing, and customization |
| [🚀 Deployment Guide](./docs/deployment/README.md) | Production deployment instructions |
| [⚙️ Configuration](./docs/configuration/README.md) | Environment and feature configuration |
| [📡 API Reference](./docs/api/README.md) | Complete API documentation |
| [🔧 Troubleshooting](./docs/troubleshooting/README.md) | Common issues and solutions |

### Quick Links

- **📖 [Complete Documentation](./docs/README.md)** - Start here for comprehensive guides
- **⚡ [Quick Start Tutorial](./docs/user-guide/quick-start.md)** - Get up and running in 15 minutes
- **🛠️ [Development Setup](./docs/developer-guide/README.md)** - For developers and contributors
- **🚀 [Deployment Options](./docs/deployment/README.md)** - Production deployment guides

## 🔧 Configuration Examples

### Basic Setup

```typescript
// Basic configuration for new users
export const basicConfig = {
  aiModel: 'gemini',
  fileTypes: ['.sql', '.sp', '.proc'],
  maxFileSize: '10MB',
  batchSize: 20
};
```

### Enterprise Setup

```typescript
// Enterprise configuration with advanced features
export const enterpriseConfig = {
  aiModel: 'gemini',
  customRules: true,
  batchProcessing: true,
  directDeployment: true,
  auditLogging: true,
  roleBasedAccess: true
};
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/developer-guide/README.md#contributing-guidelines) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
5. Push to your fork: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📊 Project Stats

<div align="center">

| Metric | Value |
|--------|--------|
| **Conversion Accuracy** | 95%+ for standard procedures |
| **Processing Speed** | < 30 seconds per file |
| **Supported File Types** | 6+ SQL file formats |
| **AI Models** | Multiple options available |
| **Max File Size** | 10MB per file |
| **Batch Processing** | Up to 50 files |

</div>

## 🛟 Support

### Getting Help

- **📚 Documentation**: Check our [comprehensive docs](./docs/README.md)
- **🐛 Issues**: [GitHub Issues](https://github.com/Kbc981/oracle-ai-migrate-gcp/issues) for bug reports
- **💬 Discussions**: [GitHub Discussions](https://github.com/Kbc981/oracle-ai-migrate-gcp/discussions) for questions
- **📧 Email**: [support@migration-tool.com](mailto:support@migration-tool.com)

### Community

- **🌟 Star us on GitHub** if this project helps you!
- **🐦 Follow updates** on our social channels
- **🤝 Contribute** to make the tool even better

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powering our conversion engine
- **Supabase** for providing the backend infrastructure
- **Open Source Community** for the amazing libraries and tools
- **Contributors** who help make this tool better every day

---

<div align="center">

**Made with ❤️ for the database migration community**

[⬆ Back to Top](#sybase-to-oracle-migration-tool)

</div>
