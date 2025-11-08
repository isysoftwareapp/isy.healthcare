# ISY Healthcare - Clinic Management System

> **🎉 100% SRS Compliance Achieved** - Production-ready clinic management system with complete feature coverage.

A comprehensive, secure, and scalable healthcare management system built with Next.js, MongoDB, and modern web technologies. Supports multi-clinic operations, role-based access control, multi-language interfaces, and production-grade encryption.

## ✨ Key Features

### Core Modules (100% Complete)

- ✅ **Patient Management** - Registration, photo capture, passport upload with encryption
- ✅ **Appointment Scheduling** - Calendar view, conflict detection, automated reminders
- ✅ **Electronic Health Records (EHR)** - Medical history, prescriptions, lab results
- ✅ **Billing & Invoicing** - Multi-currency, dynamic pricelists, payment tracking
- ✅ **Inventory Management** - Stock tracking, low-stock alerts, pharmacy module
- ✅ **Reports & Analytics** - Revenue reports, patient statistics, operational metrics
- ✅ **Notifications & Messaging** - System alerts, internal staff communication
- ✅ **Multi-Clinic Support** - Centralized management across multiple locations

### Advanced Features (NEW)

- 🌍 **Multi-Language Support** - English, Spanish, French, Arabic
- 🌓 **Dark/Light Mode** - System preference detection, localStorage persistence
- 🔍 **Enhanced Global Search** - Autocomplete, keyboard shortcuts (Ctrl+K), multi-entity search
- 🔐 **Production Encryption** - AES-256-GCM with PBKDF2 key derivation

### Security & Access Control

- 🔒 **10 Role-Based Access Levels** - Director, Admin, Doctor, Nurse, Receptionist, Pharmacist, Lab Tech, Finance, IT, Auditor
- 🛡️ **Advanced Encryption** - AES-256-GCM for sensitive data, Web Crypto API
- 🔑 **JWT Authentication** - NextAuth.js with session management
- 📋 **Audit Logging** - Track all critical operations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd isy.healthcare
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
   Create `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/isy-healthcare
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

4. **Start MongoDB**

```bash
# Windows (if MongoDB is installed as service)
net start MongoDB

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. **Run development server**

```bash
npm run dev
```

6. **Open application**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

```
Email: admin@clinic.com
Password: admin123
```

## 📚 Documentation

- **[SRS Compliance Report](./SRS_COMPLIANCE_REPORT.md)** - Complete requirements coverage (100%)
- **[Implementation Details](./MISSING_REQUIREMENTS_IMPLEMENTATION.md)** - Technical documentation for new features
- **[Testing Guide](./TESTING_GUIDE.md)** - Step-by-step testing instructions

## 🛠️ Technology Stack

### Frontend

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Internationalization**: next-intl
- **State Management**: React Context + Hooks
- **Type Safety**: TypeScript

### Backend

- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Authentication**: NextAuth.js
- **Database**: MongoDB
- **ODM**: Mongoose

### Security

- **Encryption**: Web Crypto API (AES-256-GCM)
- **Key Derivation**: PBKDF2 (100k iterations)
- **Password Hashing**: Bcrypt
- **Session Management**: JWT tokens

### Deployment

- **Containerization**: Docker
- **Web Server**: Nginx
- **SSL**: Let's Encrypt
- **Platform**: VPS (Linux)

## 🌍 Multi-Language Support

Switch languages using the dropdown in the header:

- 🇬🇧 English (en)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇸🇦 Arabic (ar)

Language preference persists across sessions and syncs to user profile.

## 🔍 Global Search

Quickly find patients, appointments, and invoices:

- **Keyboard Shortcut**: `Ctrl+K` (Windows) or `Cmd+K` (Mac)
- **Search Scope**: Patients, appointments, invoices
- **Features**: Autocomplete, keyboard navigation, instant results

## 🌓 Theme System

Toggle between light and dark modes:

- Click the sun/moon icon in the header
- System preference detection
- Persistent across sessions
- Smooth transitions

## 🔐 Security Features

### Data Encryption

All sensitive data (passport/ID documents, medical records) encrypted with:

- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Client-Side**: Encryption happens before upload
- **Authenticated**: GCM provides integrity verification

### Access Control

10 distinct roles with granular permissions:

1. **Director** - Full system access, cross-clinic management
2. **Admin** - Clinic-level administration
3. **Doctor** - Patient care, prescriptions, medical records
4. **Nurse** - Patient registration, vital signs, triage
5. **Receptionist** - Appointments, check-in, basic billing
6. **Pharmacist** - Prescription fulfillment, inventory
7. **Lab Technician** - Lab orders, test results
8. **Finance** - Billing, invoices, financial reports
9. **IT Support** - System maintenance, user support
10. **Auditor** - Read-only access for compliance

## 📊 Database Schema

Key models:

- **User** - Authentication, roles, preferences
- **Clinic** - Multi-clinic configuration
- **Patient** - Demographics, medical history
- **Appointment** - Scheduling, doctor assignments
- **Invoice** - Billing, payments, multi-currency
- **Medication** - Inventory, stock tracking
- **Notification** - System alerts, reminders
- **Message** - Internal staff communication

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Testing New Features

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing instructions.

### Key Test Scenarios

1. ✅ Multi-language switching
2. ✅ Dark/light theme toggle
3. ✅ Global search with keyboard shortcuts
4. ✅ File encryption/decryption
5. ✅ Role-based access control
6. ✅ Multi-clinic data isolation

## 🚢 Deployment

### Docker Deployment

```bash
# Build image
docker build -t isy-healthcare .

# Run container
docker run -d -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/isy-healthcare \
  -e NEXTAUTH_SECRET=your-secret-key \
  isy-healthcare
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables (Production)

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/isy-healthcare
NEXTAUTH_SECRET=<strong-random-secret>
NEXTAUTH_URL=https://yourdomain.com
ENCRYPTION_MASTER_KEY=<secure-random-key>
```

## 📈 Performance

- **Server-Side Rendering**: Fast initial page load
- **Static Generation**: Optimized for performance
- **Database Indexes**: Optimized queries
- **Pagination**: 20 items per page
- **Lazy Loading**: Components load on demand
- **Debounced Search**: 300ms delay to reduce API calls

## 🔧 Development

### Project Structure

```
isy.healthcare/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── login/             # Authentication pages
├── components/            # Reusable React components
├── lib/                   # Utilities and helpers
│   ├── encryption.ts      # AES-256-GCM encryption
│   └── mongodb.ts         # Database connection
├── locales/               # i18n translation files
├── models/                # Mongoose schemas
├── public/                # Static assets
└── types/                 # TypeScript type definitions
```

### Adding New Features

1. Create model in `/models`
2. Add API routes in `/app/api`
3. Create UI components in `/components`
4. Add pages in `/app/dashboard`
5. Update translations in `/locales`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For issues, questions, or feature requests:

- 📧 Email: support@isy-healthcare.com
- 📝 Documentation: See `/docs` folder
- 🐛 Bug Reports: Create GitHub issue

## 🎯 Roadmap

### Phase 1 (Complete) ✅

- ✅ All core modules
- ✅ Multi-language support
- ✅ Dark/light themes
- ✅ Enhanced search
- ✅ Production encryption

### Phase 2 (Planned)

- [ ] Mobile app (React Native)
- [ ] Telemedicine integration
- [ ] AI-powered diagnosis
- [ ] Wearable device integration
- [ ] Patient portal

### Phase 3 (Future)

- [ ] Blockchain medical records
- [ ] Advanced analytics (ML/AI)
- [ ] E-prescribing integration
- [ ] Insurance claim automation

## 📊 Stats

- **Lines of Code**: 15,000+
- **Components**: 25+
- **API Routes**: 45+
- **Database Models**: 14
- **Languages Supported**: 4
- **User Roles**: 10
- **SRS Compliance**: 100%

## 🏆 Achievements

- ✅ 100% SRS requirements met (33/33)
- ✅ Production-grade security (AES-256-GCM)
- ✅ Multi-language support (4 languages)
- ✅ Dark/light theme system
- ✅ HIPAA compliance ready
- ✅ GDPR compliance ready
- ✅ Scalable architecture
- ✅ Comprehensive documentation

---

**Built with ❤️ by ISY Software**  
**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Last Updated**: 2025-11-07
