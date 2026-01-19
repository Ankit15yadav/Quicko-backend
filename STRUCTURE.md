# Project Structure Documentation

## Overview
This NestJS application follows a modular, scalable architecture with clear separation of concerns.

## Directory Structure

```
src/
├── main.ts                        # Application entry point
├── app.module.ts                  # Root module
│
├── common/                        # Shared utilities & cross-cutting concerns
│   ├── constants/                 # Application-wide constants
│   ├── decorators/                # Custom decorators
│   ├── filters/                   # Exception filters
│   ├── guards/                    # Authentication & authorization guards
│   ├── interceptors/              # Request/response interceptors
│   ├── middlewares/               # Custom middleware
│   ├── pipes/                     # Validation & transformation pipes
│   ├── index.ts                   # Barrel exports
│   
│
├── config/                        # Configuration files
│   ├── throttle.config.ts         # Rate limiting configuration
│   ├── index.ts                   # Barrel exports
│   
│
├── core/                          # Core application functionality
│   ├── routing/                   # Application routing
│   │   └── app.routes.ts          # Route definitions
│   
│
├── modules/                       # Feature modules
│   ├── auth/                      # Authentication module
│   │   ├── auth.module.ts         # Module definition
│   │   ├── controllers/           # Auth controllers
│   │   │   └── auth.controller.ts
│   │   ├── services/              # Auth services
│   │   │   └── auth.service.ts
│   │   └── dto/                   # Data transfer objects
│   │       ├── sendOtp.dto.ts
│   │       └── verifyOtp.dto.ts
│   │
│   └── users/                     # Users module
│       ├── users.module.ts        # Module definition
│       ├── controllers/           # User controllers
│       │   └── users.controller.ts
│       ├── services/              # User services (empty)
│       ├── dto/                   # Data transfer objects
│       ├── entities/              # Database entities
│       └── interfaces/            # TypeScript interfaces
│
└── shared/                        # Shared business logic
    ├── interfaces/                # Shared interfaces
    ├── types/                     # Shared types
    
```

## Design Principles

### 1. Separation of Concerns
- **common/**: Technical utilities (decorators, guards, pipes)
- **shared/**: Business logic utilities (interfaces, types)
- **modules/**: Feature-specific code

### 2. Module Structure
Each feature module follows this pattern:
```
module-name/
├── module-name.module.ts          # Module definition
├── controllers/                   # HTTP layer
├── services/                      # Business logic
├── dto/                          # Data transfer objects
├── entities/                     # Database models
└── interfaces/                   # TypeScript interfaces
```

### 3. Import Aliases
Configure path aliases in tsconfig.json:
```typescript
// Instead of: import { X } from '../../../common/decorators'
// Use: import { X } from '@common/decorators'
```

Available aliases:
- `@/*` → `src/*`
- `@common/*` → `src/common/*`
- `@config/*` → `src/config/*`
- `@core/*` → `src/core/*`
- `@modules/*` → `src/modules/*`
- `@shared/*` → `src/shared/*`

## Best Practices

### Adding New Features
1. Create a new module in `src/modules/`
2. Follow the module structure pattern
3. Register routes in `src/core/routing/app.routes.ts`
4. Import the module in `app.module.ts`

### Adding Shared Utilities
1. **Technical utilities** → `src/common/`
   - Guards, Pipes, Interceptors, Decorators
2. **Business utilities** → `src/shared/`
   - Interfaces, Types, Helper functions

### Configuration
- Add new config files to `src/config/`
- Export through `src/config/index.ts`
- Import using `@config/*` alias

## Migration Notes

### What Changed
1. ✅ Created organized directory structure
2. ✅ Moved controllers/services to subdirectories
3. ✅ Reorganized config files
4. ✅ Added path aliases for cleaner imports
5. ✅ Created users.module.ts
6. ✅ Updated all import paths

### File Movements
- `app.throttle.presets.ts` → `config/throttle.config.ts`
- `app.routing.modules.ts` → `core/routing/app.routes.ts`
- `auth.controller.ts` → `auth/controllers/auth.controller.ts`
- `auth.service.ts` → `auth/services/auth.service.ts`
- `users.controller.ts` → `users/controllers/users.controller.ts`

## Next Steps

1. **Add Guards**: Implement authentication guards in `common/guards/`
2. **Add Interceptors**: Add logging/response transformation in `common/interceptors/`
3. **Environment Config**: Add environment-based configuration
4. **Database**: Set up TypeORM/Prisma and add entities
5. **Validation**: Add global validation pipes
6. **Error Handling**: Implement exception filters

## Testing Structure
Mirror the source structure in your test directory:
```
test/
├── unit/
│   ├── modules/
│   │   ├── auth/
│   │   └── users/
│   └── common/
└── e2e/
    ├── auth.e2e-spec.ts
    └── users.e2e-spec.ts
```
