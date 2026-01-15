# 🚀 Quicko Backend

<p align="center">
  <strong>Instant Delivery Platform API</strong>
</p>

<p align="center">
  Built with <a href="http://nestjs.com/" target="_blank">NestJS</a> | TypeScript | Node.js
</p>

## 📖 Description

**Quicko** is a modern instant delivery platform backend inspired by popular quick commerce apps like **Blinkit**. This API powers a seamless shopping experience for users who need groceries, essentials, and daily items delivered to their doorstep within minutes.

### ✨ Key Features

- 🔐 **Authentication System** - OTP-based phone authentication for secure user access
- 🛒 **Product Management** - Browse and search products across multiple categories
- 📦 **Order Management** - Real-time order tracking and status updates
- 🚚 **Delivery System** - Quick delivery slot management
- 👤 **User Profiles** - Manage user information and preferences
- 🛡️ **Rate Limiting** - Built-in protection against API abuse
- 🎯 **API Versioning** - Support for multiple API versions

### 🏗️ Architecture

This project follows a modular, scalable architecture with clean separation of concerns:

```
src/
├── common/          # Shared utilities (guards, pipes, interceptors)
├── config/          # Configuration files
├── core/            # Core functionality (routing)
├── modules/         # Feature modules (auth, users, etc.)
└── shared/          # Shared business logic
```

For detailed structure information, see [STRUCTURE.md](STRUCTURE.md).

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Runtime**: Node.js
- **Package Manager**: pnpm
- **API Features**: Rate Limiting, Versioning, OTP Authentication

## 📚 API Modules

### Authentication (`/api/v1/auth`)
- `POST /login/send-otp` - Send OTP to phone number
- `POST /login/verify-otp` - Verify OTP and authenticate user

### Users (`/api/v1/users`)
- User profile management
- Address management
- Order history

## 🚀 Deployment

When deploying to production:

1. Set environment variables for production
2. Build the application: `pnpm build`
3. Start with: `pnpm start:prod`
4. Configure reverse proxy (nginx/Apache)
5. Set up SSL certificates
6. Configure database connections
7. Set up monitoring and logging

For NestJS deployment best practices, check out the [deployment documentation](https://docs.nestjs.com/deployment).

## 📁 Project Structure

This project uses a well-organized, scalable folder structure. See [STRUCTURE.md](STRUCTURE.md) for detailed information about the architecture and how to add new features.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Project Structure Guide](STRUCTURE.md)

## 👨‍💻 Author

**Ankit Yadav**
- GitHub: [@Ankit15yadav](https://github.com/Ankit15yadav)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- Inspired by instant delivery platforms like Blinkit, Zepto, and Instamart
