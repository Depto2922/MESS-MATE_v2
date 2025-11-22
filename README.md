# MESS-MATE v2 - Dynamic Web Application

MESS-MATE is a comprehensive mess management system that helps students manage their hostel/mess expenses, meals, tasks, and member coordination. This version has been upgraded to use Supabase as the backend database, making it a fully dynamic web application.

## Features

- **User Authentication**: Secure signup/login with email verification
- **Mess Management**: Create or join existing messes
- **Member Management**: Add, remove, and manage mess members
- **Expense Tracking**: Track daily bazar costs and shared expenses
- **Meal Planning**: Record meal counts and calculate per-meal rates
- **Task Management**: Assign and track cleaning/maintenance tasks
- **Deposit Tracking**: Record member deposits and balance calculations
- **Notice Board**: Share announcements with all members
- **Debt Management**: Handle money transactions between members
- **Reviews System**: Global reviews and feedback system

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Email Service**: EmailJS (for OTP verification)
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter)

## Setup Instructions

### 1. Prerequisites

- A Supabase account (free tier available)
- A web server (local or hosted)
- Modern web browser

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `database-schema.sql` in your Supabase SQL editor
3. Get your project URL and anon key from Settings > API

### 3. Configuration

1. Copy `config.example.js` to `config.js`
2. Update `supabase-config.js` with your Supabase credentials:
   ```javascript
   const SUPABASE_URL = 'your-supabase-url';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

### 4. File Structure

```
MESS-MATE_v2/
├── index.html              # Main dashboard
├── login.html              # Authentication page
├── members.html            # Member management
├── expenses.html           # Expense tracking
├── meals.html              # Meal planning
├── tasks.html              # Task management
├── deposits.html           # Deposit tracking
├── profile.html            # User profile
├── supabase-config.js      # Supabase configuration
├── auth-service.js         # Authentication service
├── data-service.js         # Database operations
├── script-supabase.js      # Main application logic
├── login-supabase.js       # Login functionality
├── index-supabase.js       # Dashboard functionality
├── database-schema.sql     # Database schema
├── SUPABASE_SETUP.md       # Detailed setup guide
└── README.md               # This file
```

### 5. Deployment

#### Local Development
1. Use a local web server (e.g., Live Server in VS Code)
2. Open `login.html` to start

#### Production Deployment
1. Upload files to your web hosting service
2. Ensure HTTPS is enabled (required for Supabase)
3. Update Supabase settings with your domain

## Key Differences from v1

### Database Migration
- **Before**: localStorage (client-side only)
- **After**: Supabase PostgreSQL (persistent, multi-device)

### Authentication
- **Before**: Simple localStorage-based auth
- **After**: Supabase Auth with email verification

### Data Security
- **Before**: No security (client-side storage)
- **After**: Row Level Security (RLS) policies

### Multi-device Support
- **Before**: Single device/browser
- **After**: Access from any device with login

### Real-time Capabilities
- **Before**: No real-time updates
- **After**: Ready for real-time features (can be added)

## Usage Guide

### Getting Started
1. Open the application in your browser
2. Sign up with email verification
3. Create a new mess (as manager) or join existing mess
4. Start managing your mess data

### User Roles
- **Manager**: Full access to all features, can manage members and data
- **Member**: Can view data, add own meals, limited editing rights

### Key Features

#### Expense Tracking
- Add daily bazar costs
- Track shared expenses (utilities, etc.)
- Automatic meal rate calculation
- Member-wise expense breakdown

#### Meal Management
- Record daily meal counts per member
- Calculate per-meal costs
- Budget planning and tracking

#### Task Management
- Assign cleaning/maintenance tasks
- Track completion status
- Due date management

#### Financial Management
- Member deposit tracking
- Debt request system
- Balance calculations
- Settlement tracking

## Security Features

- Email-based authentication
- Row Level Security (RLS) policies
- Mess-scoped data access
- Role-based permissions
- Secure password handling

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check your Supabase URL and anon key
   - Ensure they're correctly set in `supabase-config.js`

2. **Authentication not working**
   - Verify email confirmation is set up in Supabase
   - Check browser console for detailed errors

3. **Data not loading**
   - Ensure you're logged in and have selected a mess
   - Check RLS policies in Supabase

4. **OTP not received**
   - Check spam folder
   - Verify EmailJS configuration
   - Ensure email service is working

### Getting Help

1. Check the browser console for error messages
2. Review Supabase logs in the dashboard
3. Refer to `SUPABASE_SETUP.md` for detailed setup instructions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For support and questions:
- Check the documentation
- Review Supabase documentation
- Create an issue in the repository

## Future Enhancements

- Real-time notifications
- Mobile app version
- Advanced reporting
- Integration with payment systems
- Multi-language support
- Dark mode theme